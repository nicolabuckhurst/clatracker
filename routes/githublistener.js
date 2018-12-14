var express = require('express');
var router = express.Router();

var verifySignature= require('../helpers/verifySignature');

var databaseStore=require('../models/DatabaseStore');
var githubInterface=require("../models/GitHubInterface");

var Promise = require("bluebird")

/***WEBHOOK ROUTE*************/
//this route is called when github sends a payload via webhook
router.post('/', function(req,res,next){

  //check payload haeaders
  let payloadHeaderCheck = checkPayloadHeaders(req)
  if(payloadHeaderCheck["status"] == "failed"){
    res.status(500).send(payloadHeaderCheck["message"]);
    return //immediately return
  }
  console.log("headers ok")

  //check payload hasn't been tampered with
  let xhubSignatureCheck = verifyXHubSignature(req)
  if(xhubSignatureCheck["status"] == "failed"){
    res.status(500).send(xhubSignatureCheck["message"]);
    return //immediately return
  }
  console.log("signature ok")

  //take raw payload and check data and then simplify to include just what we need
  let payloadDataCheck = checkPayloadData(req);
  if(payloadDataCheck["status"] == "failed"){
    res.status(500).send(payloadDataCheck["message"]);
    return //immediately return
  }

  //if payload data is all present set payload variable to our new simplified payload object
  let payload = payloadDataCheck["data"]
  console.log("payload:" + JSON.stringify(payload))

  //check that author is NOT a member of org 
  let isAuthorNonMemberCheck = checkisAuthorNonMember(payload);
  if(isAuthorNonMemberCheck["status"]=="failed"){
    res.status(200).send(isAuthorNonMemberCheck["message"]); //send a 200 as this is not an error but we don't need to do anything is author is member
    return //immediately return
  }
  console.log("author non member")


  //return a promise to retrieve the CLARequirements from Database
  let requiredCLAPromise = databaseStore.retrieveCLARequirementsAsync(payload["repoName"]) //declare this promise here so its resolved vale is accessable further down promise chain
  let state
  let description
  let target_url
  let context = "CLATracker"
  let success_code
  let success_message
  let fail_code = 500
  let fail_message = "something went wrong setting pull request status"
  
  return requiredCLAPromise
  //then check to see if user has signed required CLA
  .then(function(version){
    if(version != null){
      return databaseStore.checkCLASignedAsync(payload["id"], version) //CLA is required check if user has signed
    } else {
      return "not required" //no CLA is required (this will be a promise that resolves to "not required" as its being returned from a then())
    }
  })
  //then update pullrequest status based on the signed status
  .then(function(signed){
    
    let requiredCLA = requiredCLAPromise.value() //the variable version is nolonger in scope here but as we know requiredCLAPromise has resoved here we can just take its value syncronously
      
    switch(signed){
      //if user has signed send a success response and send 201 response
      case true:
        console.log("user has signed relevant CLA")
        state = "success"
        description = "User has signed the relevant CLA version ( "+ requiredCLA +" )"
        target_url = req.hostname
        success_code = 201
        success_message = "User has signed relevant CLA"
      break;

      // if user needs to sign CLA
      case false:
        console.log("user has NOT signed relevant CLA")
        state = "failure"
        description = "User must sign CLA "+ requiredCLA + " before this pull request can be merged"
        target_url = req.hostname + "/CLA/" + encodeURIComponent(requiredCLA) + "/" + encodeURIComponent(payload["repoName"]) + "/" + encodeURIComponent(payload["pullRequestSha"]),
        success_code = 202
        success_message = "user has NOT signed relevant CLA"
      break;

      //if no CLA is required 
      case "not required":
        console.log("CLA not required")
        state = "success"
        description = "No CLA required"
        target_url = req.hostname
        success_code = 203
        success_message = "CLA Not Required"
      break;

      default:
        console.log("something went wrong checking CLA signed status")
        res.status(500).send("unexpected output from checking whether CLA was signed")
        return ("status not set") //returns a promise that resolves to "status not set"
    }
      
    return githubInterface.setPullRequestStatusAsync(payload["repoName"], payload["pullRequestSha"],
                                           { "state":state,
                                              "description":description,
                                              "target_url":target_url,
                                              "context":context
                                            },
                                            process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
  })
  .then(function(response){
    if(response == "status set"){
      res.status(success_code).send(success_message)
    } else {
      res.status(fail_code).send(fail_message)
    } 
  })
})


/***SUB FUNCTIONS*************/

//function that checks that payload is valid --if any of the checks fail immediately return with status failed and apporiate message.
function checkPayloadHeaders(req) {
  //fail if payload has no webhook secret set
  if(req.get('X-Hub-Signature')==undefined){
    return {status:"failed",message:"please configure secret for the webhook on this repository"}
  }
  //fail if payload has data in non JSON format as verify Signature function won't work
  if(req.get('content-type')!='application/json'){
    return {status:"failed",message:"please configure webhook to send data as application/json"}
  }
  //otherwise return passed
  return {status:"passed"}
}

//function that verifies payload against X-Hub_signature header
function verifyXHubSignature(req){
  //in test mode don't bother verifying against X-Hub_Signature - verifySignature funtion is tested seperately
  if(process.env.NODE_ENV=="test"){
    return {status:"passed", message:"don't verify against signature in test mode"}
  } 
  //fail if can't verify signature
  if(verifySignature(req.body, req.get('X-Hub-Signature'))==false) {
    return {status:"failed", message:"could not confirm payload was from github check content type is set to application/JSON in webhook"}
  }
  //otherwise return passed
  return {status:"passed"}
}

//function that checks and simplifies payloadData
function checkPayloadData(req) {
  let payloadData ={};
  payloadData["login"]=req.body["pull_request"]["user"]["login"];
  payloadData["id"] =req.body["pull_request"]["user"]["id"];
  payloadData["authorAssociation"]=req.body["pull_request"]["author_association"];
  payloadData["repoName"] = req.body["repository"]["full_name"];
  payloadData["pullRequestSha"] = req.body["pull_request"]["head"]["sha"];

  //check all the required data fields are present
  for(var property in payloadData){
    if(payloadData[property]==undefined){
      return {status:"failed", message:property + " field not present in payload"};
    }
  }
  return {status:"passed",data:payloadData};
}

//check that author of pull request is NOT a member if organisation that owns repository
function checkisAuthorNonMember(payloadData){
  if(payloadData["authorAssociation"]=="MEMBER"){
    return {status:"failed", message:"author is member of organisation"}
  } else {
    return {status:"passed"}
  }
}


module.exports = router;
