var express = require('express');
var router = express.Router();

var verifySignature= require('../helpers/verifySignature');

var databaseStore=require('../models/DatabaseStore');

router.post('/', function(req,res,next){

    //don't process payloads that have no webhook secret set
    if(req.get('X-Hub-Signature')==undefined){
      res.status(500).send("please configure secret for the webhook on this repository")
      console.log("failed X-Hub-Signature exits");
      return
    }

    //don't process payloads wherea data in non JSON format as verify Signature function won't work
    if(req.get('content-type')!='application/json'){
      res.status(500).send("please configure webhook to send data as application/json")
      console.log("failed content-type is json");
      return
    }

    //don't accept payloads that don't verify against x-hub-signature
    if(process.env.NODE_ENV=="test"){
      //in test mode don't bother verifying against X-Hub_Signature
      //-- this funtion is tested seperately
    } else {
      if(verifySignature(req.body, req.get('X-Hub-Signature'))==false) {
        res.status(500).send("could not confirm payload was from github check content type is set to application/JSON in webhook")
        console.log("failed to match X-Hub-Signature");
        return
      }
    }

    var payloadData = getDataFromPayload(req);

    //don't accept payloads that don't have required info
    if(payloadData==null){
      res.status(500).send("required fields not present in payload")
      console.log("failed to find required fields in payload");
      return
    }

    //if author of pull request is a Member of the organisation that owns repository do nothing
    if(payloadData["authorAssociation"]=="MEMBER"){
      res.status(200).send("author is member of organisation"); //if author is a member of organisation that owns repository do nothing
        return
    }


    return checkCLASignedStatusAsync(payloadData)
        .then(function(status){
          switch(status){
            case true:
              console.log("user has signed relevant CLA")
              res.status(201).send("user has signed relevant CLA")
              break;
            case false:
              console.log("user has NOT signed relevant CLA")
              res.status(202).send("user has NOT signed relevant CLA")
              break;
            case "not required":
              console.log("CLA not required")
              res.status(203).send("CLA not required")
              break;
            default:
              console.log("something went wrong checking CLA signed status")
              res.status(500).send("unexpected output from checking whether CLA was signed")
          }
        })
})

//function that extracts just the required info from payload
var getDataFromPayload = function(req){
  var payloadData ={};
  payloadData["login"]=req.body["pull_request"]["user"]["login"];
  payloadData["id"] =req.body["pull_request"]["user"]["id"];
  payloadData["authorAssociation"]=req.body["pull_request"]["author_association"];
  payloadData["repoName"] = req.body["repository"]["full_name"];

  for(var property in payloadData){
    if(payloadData[property]==undefined){
      return null;
    } else {
      return payloadData
    }
  }
}

//check if user has signed required CLA or if its not required
var checkCLASignedStatusAsync = function(payloadData){

  //look up CLARTequirements for Repository
  return databaseStore.checkCLARequirementsAsync(payloadData["repoName"])
    .then(function(version){
      console.log("required cla"+version)
      if(version != null){
        return databaseStore.checkCLAAsync(payloadData["id"], version)
      } else {
        return "not required"
      }
    })
    .then(function(signed){
      return signed;
    })
}

module.exports = router;
