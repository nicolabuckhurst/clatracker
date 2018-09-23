var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//express session module -- required for passport
var expressSession = require('express-session');

//passport modules --required for passport
var passport = require('passport');
var Strategy = require('passport-github2').Strategy;

//module for interacting with database -- required for passport
var databaseStore = require('./models/DatabaseStore')

//a module for storing session info to redis database rather than default memory store
var RedisStore = require('connect-redis')(expressSession);
var redis = require('redis');


var index = require('./routes/index');
var users = require('./routes/users');
var githublistener = require('./routes/githublistener');
var status = require('./routes/status');
var cla = require('./routes/CLA');
var login = require('./routes/login');

var app = express();

//configure passport strategy for github login with the client id and client
//secret generated by facebook for this app and stored in envirmonment variables
//to avoid accidently uploading to github...you can use profileFields to specify the
//github profile fields required
passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GITHUB_RETURN,
    profileFields:['email','photos','username','id']
  },
  //the strategy obect contains your verify function which takes the accessToken,
  //refreshToken and profile from github. You can write this to your database or
  //look up a user thats aleady in the database based on this data from github.
  //Your verify function also takes a callback which we call done....this function
  //is passed into tyour function by passport....it has to have 2 arguments, the
  //second of which is the user object you want to be stored as req.object.
  //Calling return done() at the end of your code causes the verify function to
  // return the result from done() which is required by passport
  function(accessToken, refreshToken, profile, done) {
    //variable to create the user object ultimately written to req.object
    var user = {};
    //return a promise to find user by github id...will either resolve to a
    //user object returned from database corresponding to this github id or null
    //if the uswr can't be found in database
    databaseStore.retrieveUserDetailsAsync(profile.id)
      .then(function(userDetails){
        //create a user object from the facebook profile
        //and return a promise chain that promises to store the user in the
        //database and then return that user object --if user is already
        //in database then storeUserDetailsAsync will update the data in the
        //database
        console.log(profile)
        user.login = profile.username;
        user.id = profile.id;
        user.githubPicture = profile.photos[0]["value"];
        user.admin = false;
        user.email = profile.emails[0]["value"];
        return databaseStore.storeUserDetailsAsync(profile.id, user)
          .then(function(){
            return databaseStore.retrieveUserDetailsAsync(profile.id)
          });
      })
      // then finally when all the previous promises have resolved call done(null, user)
      // to make passport put the user into the req.object
      .then(function(user){
        console.log('user object returned from database:'+JSON.stringify(user))
        return done(null, user);
      })
  }));

  //ADDED TO DEFAULT EXPRESS APP TO USE PASSPORT AUTHENTICATION..allows you
  //to specify what is saved in session information and passes into cookie
  //on browser
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  In a
  // production-quality application, this would typically be as simple as
  // supplying the user ID when serializing, and querying the user record by ID
  // from the database when deserializing.
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    databaseStore.retrieveUserDetailsAsync(id)
      .then(function(user){
        done(null, user)
      })
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//ADDED TO DEFAULT EXPRESS APP TO USE PASSPORT AUTHENTICATION
//need to use express-session in order to enable persistent loginsession
//Passport uses express-Session to to store info in a session in server and then set
//cookie on client.....the default set up for express session is to save session
//in a local memory store...this in not suitable for production ....so have set
//up express session to store sesson info in same redis database as other data for
//this website
app.use(expressSession({
  cookie:{secure:true}, //use secure cookies ...server need to be running on https
  name: "sessionID", //good practice not to use default cookie name
  secret: 'si5rt2swfbcp095g', //random string i typed for securing cookie
  resave: true, ////need to check with your session store what is appropriate
  saveUninitialized: false,
  store:new RedisStore({client:redis.createClient(process.env.REDIS_URL)})
}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/users', users);
app.use('/githublistener', githublistener);
app.use('/status', status);
app.use('/CLA', cla);
app.use('/login', login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
