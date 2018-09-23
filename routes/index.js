var express = require('express');
var router = express.Router();

var databaseStore = require('../models/DatabaseStore');

/* GET home page. */
router.get('/', function(req, res, next) {
  let loggedIn, profilepicture
  let claList = {}

  //set redirect url in session object to this route...if uses chooses to click login from
  //this page they will be rerouted back here after they have logged in
  req.session.rdUrl = "/";

  //if user is logged in retrieve a liost of signed CLA's for homepage
  if (req.user != null){
    loggedIn = true;
    profilePicture = req.user["githubPicture"]
    return databaseStore.retrieveUserCLAVersions(req.user["id"])
      .then(function(claList){
          console.log(claList)
          res.render('index', { title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList});
      })
  //if not logged in render a page with an empty list
  } else {
    loggedIn = false;
    profilePicture = "#"
    res.render('index',{title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList})
  }

});





module.exports = router;
