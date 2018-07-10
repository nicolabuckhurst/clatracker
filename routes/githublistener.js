var express = require('express');
var router = express.Router();

var verifySignature= require('../helpers/verifySignature');


router.post('/', function(req,res,next){

  console.log(req.body);
  console.log(req.get('X-Hub-Signature'));

  if(verifySignature(req.body, req.get('X-Hub-Signature'))) {
    console.log("verified from github")
  } else {
    res.status(500).send("could not confirm payload was from github")
  }

  if(req.body["author_association"]=="MEMBER"){
    res.sendStatus(200); //if author is a member of organisation that owns repository do nothing
  } else {
    res.sendStatus(200);
  }
})

module.exports = router;
