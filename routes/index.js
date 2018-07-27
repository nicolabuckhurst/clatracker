var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let loggedIn, profilepicture

  if (req.user != null){
    loggedIn = true;
    profilePicture = req.user["githubPicture"]
  } else {
    loggedIn = false;
    profilePicture = "#"
  }
  res.render('index', { title: 'CLA Tracker', 'loggedIn':loggedIn, 'profilePicture':profilePicture});
});

module.exports = router;
