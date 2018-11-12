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
    console.log(payloadDataCheck["message"])
    return //return from post function
  }

  //if raw payload is valid then we create an object with just the relevant data in it
  var payloadData = payloadDataCheck["data"];

  //CHECK IF AUTHOR IS MEMBER OF ORG returns a failure object or success object......see comments below
  var isAuthorNonMemberCheck = checkisAuthorNonMember(payloadData);

  //deal with user is a member --send a 200 as this is a valid payload but it doesn't
  //require us to do anything
  if(isAuthorNonMemberCheck["status"]=="failed"){
    res.status(200).send(isAuthorNonMemberCheck["message"]);
    return //return from post function
  }

  //return a promise to retrieve the CLARequirements from Database
  var requiredCLAPromise = databaseStore.retrieveCLARequirementsAsync(payloadData["repoName"])
  return requiredCLAPromise
  //then check to see if user has signed required CLA
  .then(function(version){
    if(version != null){
      //if a CLA is required check if user has signed it..returns true or false
      return databaseStore.checkCLASignedAsync(payloadData["id"], version)
    } else {
      //if no CLA is required return "not required" as signed status
      return "not required"
    }
  })
  //then update pullrequest status based on the signed status
  .then(function(signed){
    let state
    let description
    let target_url
    let context = "CLATracker"
    let success_code
    let success_message
    let fail_code = 500
    let fail_message = "something went wrong setting pull request status"
    
    requiredCLA = requiredCLAPromise.value() //the variable version is nolonger in scope here but as the promise to get clarequirements has top have resoved here we can just take its value syncronously
      
    switch(signed){
      //if user has signed send a success response and send 201 response
      case true:
        console.log("user has signed relevant CLA")
        state = "success"
        description = "User has signed the relevant CLA version ( "+ requiredCLA +" )"
        target_url = "https://localhost:3000"
        success_code = 201
        success_message = "User has signed relevant CLA"
      break;

      // if user needs to sign CLA
      case false:
        console.log("user has NOT signed relevant CLA")
        state = "failure"
        description = "User must sign CLA "+ requiredCLA + " before this pull request can be merged"
        target_url = "https://localhost:3000/CLA/" + encodeURIComponent(requiredCLA) + "/" + encodeURIComponent(payloadData["repoName"]) + "/" + encodeURIComponent(payloadData["pullRequestSha"]),
        success_code = 202
        success_message = "user has NOT signed relevant CLA"
      break;

      //if no CLA is required 
      case "not required":
        console.log("CLA not required")
        state = "success"
        description = "No CLA required"
        target_url = "https://localhost:3000"
        success_code = 203
        success_message = "CLA Not Required"
      break;

      default:
          console.log("something went wrong checking CLA signed status")
          res.status(500).send("unexpected output from checking whether CLA was signed")
    }
      

    return githubInterface.setPullRequestStatusAsync(payloadData["repoName"], payloadData["pullRequestSha"],
                                           { "state":state,
                                              "description":description,
                                              "target_url":target_url,
                                              "context":context
                                            },
                                            process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(response){
      if(response == "status set"){
        res.status(success_code).send(success_message)
      } else {
          res.status(fail_code).send(fail_message)
      }
    })  
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
