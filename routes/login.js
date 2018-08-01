var express = require('express');
var router = express.Router();

var passport = require('passport');

router.get('/github', passport.authenticate('github', { scope: [ 'user:email, read:user' ] }));


router.get('/github/return', passport.authenticate('github', { failureRedirect: '/CLA'}),
  function(req, res){
    console.log("the user object returned"+JSON.stringify(req.user));
    res.redirect(req.session.rdUrl)
  }
);

router.get('/logout', function(req, res, next){
  req.logout();
  console.log(req.user)
  res.redirect('/'); //redirect back to homepage
});

module.exports = router;
