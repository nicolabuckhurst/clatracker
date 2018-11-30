var express = require('express');
var router = express.Router();

var databaseStore = require('../models/DatabaseStore');

/* GET home page. */
router.get('/', function(req, res, next) {
  let loggedIn, profilePicture
  let claList = {}
  let admin

  //set redirect url in session object to this route...if uses chooses to click login from
  //this page they will be rerouted back here after they have logged in
  req.session.rdUrl = "/";

  //if user is logged in set admin status in session and retrieve a list of signed CLA's for homepage
  if (req.user != null){
    //check if user is admin and if they are store this information in session
    return databaseStore.checkAdminStatus(req.user["id"])
    .then(function(adminStatus){
      admin=adminStatus;

      loggedIn = true;
      profilePicture = req.user["githubPicture"]

      return databaseStore.retrieveUserCLAVersions(req.user["id"])
    })
    .then(function(claListFromDatabase){
      claList = claListFromDatabase
      res.render('index', { title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList, 'admin':admin});
    })
  //if not logged in render a page with an empty list
  } else {
    loggedIn = false;
    profilePicture = "#"
    res.render('index',{title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList, 'admin':admin})
  }

});





module.exports = router;
