var express = require('express');
var router = express.Router();

var expressSession = require('express-session')

var databaseStore = require("../models/DatabaseStore")

router.get("/", function(req, res, next){
  let loggedIn, profilepicture

  if (req.user != null){
    loggedIn = true;
    profilePicture = req.user["githubPicture"]
  } else {
    loggedIn = false;
    profilePicture = "#"
  }


  res.render('CLA', {"title":"Sign CLA", "loggedIn":loggedIn, "profilePicture":profilePicture})
})

module.exports=router
