var express = require('express');
var router = express.Router();

var passport = require('passport');

/* GET home page. */
router.get('/github', passport.authenticate('github', { scope: [ 'user:email, read:user' ] }));


router.get('/github/return', passport.authenticate('github', { failureRedirect: '/CLA'}),
  function(req, res){
    console.log(req.user);
    res.redirect('back') //redirect to referrer or to /
  }
);

router.get('/logout', function(req, res, next){
  req.logout();
  console.log(req.user)
  res.redirect('/'); //redirect back to homepage
});

module.exports = router;
