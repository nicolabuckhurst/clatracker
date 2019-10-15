var express = require('express');
var router = express.Router();

//this is just a test route to check page is responding
router.all('/', function(req,res){
  console.log(JSON.stringify(req.method))
  res.sendStatus(200)
})

module.exports = router;
