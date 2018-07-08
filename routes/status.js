var express = require('express');
var router = express.Router();


router.all('/', function(req,res,next){
  console.log(JSON.stringify(req.method))
  res.sendStatus(200)
})

module.exports = router;
