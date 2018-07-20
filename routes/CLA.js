var express = require('express');
var router = express.Router();

var expressSession = require('express-session')

var databaseStore = require("../models/DatabaseStore")

router.get("/", function(req, res, next){
  let loggedIn

  if (req.user != null){
    loggedIn = true;
  } else {
    loggedIn = false;
    expressSession.redirect = '/CLA'
  }

  res.render('signup', {"title":"Sign CLA", "loggedIn":loggedIn})
})

module.exports=router
