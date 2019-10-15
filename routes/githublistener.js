var express = require('express');
var router = express.Router();

var verifySignature = require('../helpers/verifySignature');

var databaseStore = require('../models/DatabaseStore');
var githubInterface = require("../models/GitHubInterface");

// var Promise = require("bluebird")

/***WEBHOOK ROUTE*************/
//this route is called when github sends a payload via webhook
router.post('/', function (req, res) {
  let payload;
  let state
  let description
  let target_url
  let context = "CLATracker"
  let success_code
  let success_message
  let fail_code = 500
  let fail_message = "something went wrong setting pull request status"

  //check payload haeaders, verify xhubsignature, simplify payload --simply asynchronous checks
  try {
    checkPayloadHeaders(req)

    if (process.env.NODE_ENV != "test") {
      verifyXHubSignature(req)
    }

    payload = simplifyPayload(req)

    if (checkisAuthorNonMember(payload) == false) {
      res.status(200).send("author is a member of organisation, CLA not required"); //send a 200 as this is not an error but we don't need to do anything is author is member
      return //immediately return
    }
  }
  catch (e) {
    res.status(500).send(e);
    throw e
  }

  //required CLA is needed at various points in the long following promise chain so declare it here
  let requiredCLA

  //check if user is whitelisted
  return checkIsAuthorWhitelistedAsync(payload)
    .then(function (result) {
      //user is whitelisted send a 200 and return
      if (result == true) {
        res.status(200).send("author is not required to sign a CLA for this project"); // send a 200 not an error but no cla required
        return
      }
      //user not whitelisted
      //return a promise chain that does all the following async checks
      return databaseStore.retrieveCLARequirementsAsync(payload["repoId"]) //declare this promise here so its resolved value is accessable further down promise chain
        //what CLA version is required
        .then(function (version) {
          if (version != null) {
            requiredCLA = version
            //now check if user has signed
            return databaseStore.checkCLASignedAsync(payload["id"], version) //CLA is required check if user has signed
          } else {
            return "not required" //no CLA is required (this will be a promise that resolves to "not required" as its being returned from a then())
          }
        })
        //then update pullrequest status based on the signed status
        .then(function (signed) {
          switch (signed) {
          //if user has signed send a success response and send 201 response
          //should be able to use req.HOSTNAME to get hostname of originating request biut there is a bug in v4 express that 
          //doesn't return port number so this doesn't work when running app on localhost:3000. So just used an env variable to store
          //hostname ...this needs to be set when deployed
          case true:
            console.log("user has signed relevant CLA")
            state = "success"
            description = "User has signed the relevant CLA version ( " + requiredCLA + " )"
            target_url = process.env.HOSTNAME
            success_code = 201
            success_message = "User has signed relevant CLA"
            break;

            // if user needs to sign CLA
          case false:
            console.log("user has NOT signed relevant CLA")
            state = "failure"
            description = "User must sign CLA " + requiredCLA + " before this pull request can be merged"
            target_url = process.env.HOSTNAME + "/CLA/" + encodeURIComponent(requiredCLA) + "/" + encodeURIComponent(payload["repoName"]) + "/" + encodeURIComponent(payload["pullRequestSha"]),
            success_code = 202
            success_message = "user has NOT signed relevant CLA"
            break;

            //if no CLA is required 
          case "not required":
            console.log("CLA not required")
            state = "success"
            description = "No CLA required"
            target_url = process.env.HOSTNAME
            success_code = 203
            success_message = "CLA Not Required"
            break;

          default:
            console.log("something went wrong checking CLA signed status")
            res.status(500).send("unexpected output from checking whether CLA was signed")
            return ("status not set") //returns a promise that resolves to "status not set"
          }
          //set pullrequest status
          return githubInterface.setPullRequestStatusAsync(payload["repoName"], payload["pullRequestSha"],
            {
              "state": state,
              "description": description,
              "target_url": target_url,
              "context": context
            },
            process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
        })
        .then(function (response) {
          //send a succcess or fail response
          if (response == "status set") {
            res.status(success_code).send(success_message)
          } else {
            res.status(fail_code).send(fail_message)
          }
        })
    })
})


/***SUB FUNCTIONS*************/

//function that checks that payload is valid --if any of the checks fail throw error with apporiate message.
function checkPayloadHeaders(req) {
  //fail if payload has no webhook secret set
  if (req.get('X-Hub-Signature') == undefined) {
    throw ("please configure secret for the webhook on this repository")
  }
  //fail if payload has data in non JSON format as verify Signature function won't work
  if (req.get('content-type') != 'application/json') {
    throw ("please configure webhook to send data as application/json")
  }
  //otherwise return true
  return true
}

//function that verifies payload against X-Hub_signature header
function verifyXHubSignature(req) {
  //in test mode don't bother verifying against X-Hub_Signature - verifySignature funtion is tested seperately
  //if(process.env.NODE_ENV=="test"){
  //return {status:"passed", message:"don't verify against signature in test mode"}
  //} 
  //fail if can't verify signature
  if (verifySignature(req.body, req.get('X-Hub-Signature')) == false) {
    throw "could not confirm payload was from github check content type is set to application/JSON in webhook"
  }
  //otherwise return passed
  return true
}

//function that checks and simplifies payloadData
function simplifyPayload(req) {
  let payloadData = {};

  payloadData["login"] = req.body["pull_request"]["user"]["login"];
  payloadData["id"] = req.body["pull_request"]["user"]["id"];
  payloadData["authorAssociation"] = req.body["pull_request"]["author_association"];
  payloadData["repoId"] = req.body["repository"]["id"];
  payloadData["repoName"] = req.body["repository"]["full_name"]
  payloadData["pullRequestSha"] = req.body["pull_request"]["head"]["sha"];

  //check all the required data fields are present
  for (var property in payloadData) {
    if (payloadData[property] == undefined || payloadData[property] == null) {
      throw property + " field not present in payload";
    }
  }

  return payloadData;
}

//check that author of pull request is NOT a member if organisation that owns repository
function checkisAuthorNonMember(payloadData) {
  try {
    let isNonMember
    if (payloadData["authorAssociation"] == "MEMBER") {
      isNonMember = false
    } else {
      isNonMember = true
    }
    return isNonMember
  }
  catch (e) {
    throw "there was a problem checking whether author is a Member" + e
  }
}

//check if author is whitelisted
function checkIsAuthorWhitelistedAsync(payloadData) {
  try {
    return databaseStore.checkIfWhitelisted(payloadData["id"], payloadData["repoId"])
      .then(function (result) {
        return result
      })
  }
  catch (e) {
    throw "there was a problem checking is user is whitelisted" + e
  }
}


module.exports = router;
