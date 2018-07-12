var express = require('express');
var router = express.Router();

var verifySignature= require('../helpers/verifySignature');

var databaseStore=require('../models/DatabaseStore');


router.post('/', function(req,res,next){

    //don't allow webhook connections without a secret
    if(req.get('X-Hub-Signature')==undefined){
      res.status(500).send("please configure secret for the webhook on this repository")
      console.log("failed X-Hub-Signature exits");
      return
    }

    //don't accept data in non JSON format as verify Signature won't work
    if(req.get('content-type')!='application/json'){
      res.status(500).send("please configure webhook to send data as application/json")
      console.log("failed content-type is json");
      return
    }

    //verify that payload is from github
    if(process.env.NODE_ENV=="test"){
      //don't bother verifying against X-Hub_Signature -- this funtion is tested seperately
    } else {
      if(verifySignature(req.body, req.get('X-Hub-Signature'))) {
      } else {
        res.status(500).send("could not confirm payload was from github check content type is set to application/JSON in webhook")
        console.log("failed to match X-Hub-Signature");
        return
      }
    }

    //if payload contains required information
    if(req.body["pull_request"]["user"]["login"]!=undefined && req.body["pull_request"]["user"]["id"]!=undefined
        && req.body["pull_request"]["author_association"]!=undefined && req.body["repository"]["full_name"]!=undefined){
    } else {
      res.status(500).send("required fields not present in payload")
      console.log("failed to find required fields in payload");
      return
    }

    //if author of pull request is a Member of the organisation that owns repository do nothing
    if(req.body["pull_request"]["author_association"]=="MEMBER"){
      res.sendStatus(200); //if author is a member of organisation that owns repository do nothing
      return
    } else {
      //check whether CLA has been signed
      res.sendStatus(200);
    }
})

module.exports = router;
