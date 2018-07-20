var express = require('express');
var router = express.Router();

var passport = require('passport');

/* GET home page. */
router.get('/github', passport.authenticate('github', { scope: [ 'user:email, read:user' ] }));


router.get('/github/return', passport.authenticate('github', { failureRedirect: '/CLA'}),
  function(req, res){
    console.log(req.user);
    res.redirect('/CLA')
  }
);

router.get('/logout', function(req, res, next){
  req.logout();
  console.log(req.user)
  res.redirect('/CLA');
});

module.exports = router;
