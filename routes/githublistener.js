var express = require('express');
var router = express.Router();

var verifySignature= require('../helpers/verifySignature');

var databaseStore=require('../models/DatabaseStore');
var githubInterface=require("../models/GitHubInterface");

var Promise = require("bluebird")

//this route is called when github sends a payload via webhook
router.post('/', function(req,res,next){

    //CHECK PAYLOAD IS VALID returns a failure object or a success object....see comments below
    var payloadDataCheck = checkPayload(req);

    //deal with invalid payload
    if(payloadDataCheck["status"]=="failed"){
      res.status(500).send(payloadDataCheck["message"]);
      return //return from post function
    }

    //if raw payload is valid then we have an object with just the relevant data in it
    var payloadData = payloadDataCheck["data"];

    //CHECK IF AUTHOR IS MEMBER OF ORG returns a failure object or success object......see comments below
    var isAuthorNonMemberCheck = checkisAuthorNonMember(payloadData);

    //deal with user is a member --send a 200 as this is a valid payload but it doesn't
    //require us to do anything
    if(isAuthorNonMemberCheck["status"]=="failed"){
      res.status(200).send(isAuthorNonMemberCheck["message"]);
      return //return from post function
    }

    //deal with user is not a member
    //create 2 seperate promises....to get CLA requirements, and then to check if user
    //has signed....the second can only resolve once the first has resolved
    var promiseToReturnCLARequirements = databaseStore.retrieveCLARequirementsAsync(payloadData["repoName"]);

    var promiseToCheckIfSigned = promiseToReturnCLARequirements.then(function(version){
      //take the Required CLA version or null return and check if user has signed it
      if(version != null){
        //if a CLA is required check if user has signed it..returns true or false
        return databaseStore.checkCLASignedAsync(payloadData["id"], version)
      } else {
        //if no CLA is required return "not required" as signed status
        return "not required"
      }
    })

    //use Promise.join bluebird function to define a function that takes the result
    //from both resolved promises and execute given function....Do it this way rather
    //than a single promise chain as we need the version and the signed result to
    //be in scope at the end of the promise chain
    return Promise.join(promiseToReturnCLARequirements, promiseToCheckIfSigned,
      function(requiredCLA, signed){
        switch(signed){
          //if user has signed send a success response and send 201 response
          case true:
            console.log("user has signed relevant CLA")
            return githubInterface.setPullRequestStatusAsync(payloadData["repoName"], payloadData["pullRequestSha"],
                                        { "state":"success",
                                          "description":"User has signed the relevant CLA version ( "+ requiredCLA +" )",
                                          "target_url":"https://localhost:3000",
                                          "context":"CLATracker"
                                        },
                                        process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
              .then(function(response){
                if(response == "status set"){
                  res.status(201).send("user has signed relevant CLA")
                } else {
                  res.status(500).send("something went wrong setting pull request status")
                }
              })
            break;
          // if user needs to sign CLA send success response and then set github status as failed
          case false:
            console.log("user has NOT signed relevant CLA")
            return githubInterface.setPullRequestStatusAsync(payloadData["repoName"], payloadData["pullRequestSha"],
                                        { "state":"failure",
                                          "description":"User must sign CLA "+ requiredCLA + " before this pull request can be merged",
                                          //if you want to include spaces and / in url parameters...need to encode them
                                          "target_url":"https://localhost:3000/CLA/" + encodeURIComponent(requiredCLA) + "/" + encodeURIComponent(payloadData["repoName"]) + "/" + encodeURIComponent(payloadData["pullRequestSha"]),
                                          "context":"CLATracker"
                                        },
                                        process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
                .then(function(response){
                  if(response == "status set"){
                    res.status(202).send("user has NOT signed relevant CLA")
                  } else {
                    res.status(500).send("something went wrong setting pull request status")
                  }
                })
            break;
          //if no CLA is required send a success response and do nothing
          case "not required":
            console.log("CLA not required")
            return githubInterface.setPullRequestStatusAsync(payloadData["repoName"],payloadData["pullRequestSha"],
                                        { "state":"success",
                                          "description":"No CLA required",
                                          "context":"CLATracker"
                                        },
                                        process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
                .then(function(response){
                  if(response == "status set"){
                    res.status(203).send("CLA not required")
                  } else {
                    res.status(500).send("something went wrong setting pull request status")
                  }
                })
            break;
          //if checking CLA signed status returns an error
          default:
            console.log("something went wrong checking CLA signed status")
            res.status(500).send("unexpected output from checking whether CLA was signed")
          }
      })
})

//function that checks that payload is valid
var checkPayload = function(req){
  //don't process payloads that have no webhook secret set
  if(req.get('X-Hub-Signature')==undefined){
    return {"status":"failed","message":"please configure secret for the webhook on this repository"}
  }

  //don't process payloads wherea data in non JSON format as verify Signature function won't work
  if(req.get('content-type')!='application/json'){
    return {"status":"failed","message":"please configure webhook to send data as application/json"}
  }

  //don't accept payloads that don't verify against x-hub-signature
  if(process.env.NODE_ENV=="test"){
    //in test mode don't bother verifying against X-Hub_Signature
    //-- this funtion is tested seperately
  } else {
    if(verifySignature(req.body, req.get('X-Hub-Signature'))==false) {
      return {"status":"failed","message":"could not confirm payload was from github check content type is set to application/JSON in webhook"}
    }
  }

  return payloadDataCheck = checkDataInPayload(req);
}


//function that extracts just the required info from payload
//returns a failure object {status:failed, message:failure message}
//or a success object {status:passed, data:payloadData}
var checkDataInPayload = function(req){
  var payloadData ={};
  payloadData["login"]=req.body["pull_request"]["user"]["login"];
  payloadData["id"] =req.body["pull_request"]["user"]["id"];
  payloadData["authorAssociation"]=req.body["pull_request"]["author_association"];
  payloadData["repoName"] = req.body["repository"]["full_name"];
  payloadData["pullRequestSha"] = req.body["pull_request"]["head"]["sha"];

  //check all the required data fields are present
  for(var property in payloadData){
    if(payloadData[property]==undefined){
      return {"status":"failed", "message":"required fields not present in payload"};
    } else {
      return {"status":"passed","data":payloadData};
    }
  }
}

  //returns a success or fail object
  //{"status":"passed"}
  //{"status":"failed","message":"failure message"}
  var checkisAuthorNonMember = function(payloadData){
    console.log("payloadData"+JSON.stringify(payloadData))
    //if author of pull request is a Member of the organisation that owns repository do nothing
    if(payloadData["authorAssociation"]=="MEMBER"){
      console.log(payloadData["authorAssociation"]);
      return {"status":"failed", "message":"author is member of organisation"}
    } else {
      return {"status":"passed"}
    }
  }


module.exports = router;
