var express = require('express');
var router = express.Router();

var databaseStore = require('../models/DatabaseStore');

/* GET home page. */
router.get('/', function(req, res, next) {
  let loggedIn, profilepicture
  let claList = {}

  req.session.rdUrl = "/";

  if (req.user != null){
    loggedIn = true;
    profilePicture = req.user["githubPicture"]
    return databaseStore.retrieveUserCLAVersions(req.user["id"])
      .then(function(claList){
          console.log(claList)
          res.render('index', { title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList});
      })
  } else {
    loggedIn = false;
    profilePicture = "#"
    res.render('index',{title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture, 'claList':claList})
  }

});





module.exports = router;
