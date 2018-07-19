var express = require('express');
var router = express.Router();

var databaseStore = require("../models/DatabaseStore")

router.get("/", function(req, res, next){
  res.render('signup', {"title":"Sign CLA", "loginRequired":"false"})
})

module.exports=router
