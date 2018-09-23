var express = require('express');
var router = express.Router();

var passport = require('passport');

//this is the route called when user clicks login with github button..redirects to github
router.get('/github', passport.authenticate('github', { scope: [ 'user:email, read:user' ] }));

//this is the route called when github returns the authentication token..passport now requests an
//access token from github...if successful user is logged in otherwise authentication has failed and will redirect
//to failure redirect.
router.get('/github/return', passport.authenticate('github', { failureRedirect: '/CLA'}),
  function(req, res){
    //if successfully logged on redirect to rdUrl stored in session ..makes sure the user gets redirected
    //back to the page they were on before they were redirected to login
    res.redirect(req.session.rdUrl)
  }
);

//route called when user clicks on logout...simply calls the passport logout() function added to the req object
//then redirects abck to homepage
router.get('/logout', function(req, res, next){
  req.logout();
  res.redirect('/'); //redirect back to homepage
});

module.exports = router;
 
