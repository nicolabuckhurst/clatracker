var express = require('express');
var router = express.Router();


router.post('/', function(req,res,next){

  if(req.body["author_association"]=="MEMBER"){
    res.sendStatus(200); //if author is a member of organisation that owns repository do nothing
  } else {
    res.sendStatus(200);
  }
})

module.exports = router;
