var express = require('express');
var router = express.Router();

var expressSession = require('express-session')

var databaseStore = require("../models/DatabaseStore")

var showdown = require('showdown')

var claContents = require("../test/data/Apachev2.0")

var fs = require('fs');
var path = require('path')

var converter = new showdown.Converter()

router.get("/", function(req, res, next){
  let loggedIn, profilepicture
  //if user is alread logged in, set logged in to true and profilepicture so that navbar displays correctly
  if (req.user != null){
    loggedIn = true;
    profilePicture = req.user["githubPicture"]
  } else {
    //if user not logged in then redirect to login page
    loggedIn = false;
    profilePicture = "#";
    res.redirect('/login/github')
  }

  let claContentsParsed ={}

  let textPath = path.join(__dirname,'/../test/data/'+claContents["text"])

  //read the text conent of the CLA asynchronously as a utf8 encoded string and the pas
  //data into callbackURL so that the markdown text gets parsed to html before being sent to
  //ejs template
  fs.readFile(textPath,'utf8',function(err, data){
    for(property in claContents){
      if(property == "text"){
        claContentsParsed["text"] = converter.makeHtml(data)
      } else {
        claContentsParsed[property]=claContents[property]
      }
    }
    res.render('CLA', {"title":"Sign CLA", "loggedIn":loggedIn, "profilePicture":profilePicture, "claContents":claContentsParsed})
  })

})


router.post("/", function(req, res, next){
  console.log(JSON.stringify(req.body))
  res.redirect("/")

})

module.exports=router
