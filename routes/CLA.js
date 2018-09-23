var express = require('express');
var router = express.Router();

var expressSession = require('express-session')

var databaseStore = require("../models/DatabaseStore")
var gitHubInterface = require("../models/GitHubInterface")

var showdown = require('showdown')

//currently hardcoded location of claContents .json file
//this will have to be looked up using claName and a file naming convention
var claContents = require("../CLAFiles/Apachev2.0.json")

var fs = require('fs');
var path = require('path')

var converter = new showdown.Converter()

//this is the route which displays the CLA form to be filled in
//the URL contains 3 parameters claName, repoName, pullRequestSha
//repoName and pullRequestSha are needed so we can update pullrequestatus on github
router.get("/:claName/:repoName/:pullRequestSha", function(req, res, next){
  let claName = req.params.claName
  let repoName = req.params.repoName
  let pullRequestSha = req.params.pullRequestSha

  //url to redirect back to if user is redirected to login from here
  //you need to encode any special characters in the claName,repoName and pullRequestSha
  req.session.rdUrl = "/CLA/"+encodeURIComponent(req.params.claName) + "/" + encodeURIComponent(req.params.repoName) + "/" + encodeURIComponent(req.params.pullRequestSha)

  let loggedIn, profilepicture

  if(req.user == null){
    //if user not logged in then redirect to login page
    loggedIn = false;
    profilePicture = "#";
    res.redirect('/login/github')
  }

  //if user is alread logged in, set logged in to true and profilepicture so that navbar displays correctly
  loggedIn = true;
  profilePicture = req.user["githubPicture"]


  //check if user has already signed the CLA --- it is possible that the user has
  //signed this CLA since pull request was made generating a link to this page....
  //so check for signing again here
  return databaseStore.checkCLASignedAsync(req.user["id"],req.params.claName)
    .then(function(signed){

      //if user has signed update pull request status and alert user with message
      if(signed== true){
        return gitHubInterface.setPullRequestStatusAsync(req.params.repoName, req.params.pullRequestSha,
            { "state":"success",
              "description":"User has signed the relevant CLA version ( "+ claContents["name"] +" )",
              "target_url":"https://localhost:3000",
              "context":"CLATracker"
            },
            process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
          .then(function(response){
            if(response == "status set"){
              //render a page that informs user they have already signed the CLA
              res.render('alert',{"title":"Alert", "loggedIn":loggedIn, "profilePicture":profilePicture, message:"You have already signed the relevant CLA since submitting your pull request, the pull request status on Github has now been updated"})
            }else{
              res.render('alert',{"title":"Alert", "loggedIn":loggedIn, "profilePicture":profilePicture, message:"You have already signed the relevant CLA since submitting your pull request, however there was a problem updating the pull request status on Github. Please resubmit your pull request"})
            }
          })
      }

      //if user hasn't signed go ahead and generate a cla form to fill in

      //when we post the CLA form back to server we want to keep track of
      //claName and the repoName and pull requestsha from this route Parameters
      //so we can trigger an update to the pullrequest status on github once the
      //cla is signed...so create a link that parses these parameters in url
      //encoding any special characters
      let postURL = "/CLA/" + encodeURIComponent(req.params.claName) + "/" + encodeURIComponent(req.params.repoName) + "/" + encodeURIComponent(req.params.pullRequestSha)

      //we need to read in the markdown text content of the CLA
      let claContentsParsed ={}
      let textPath = path.join(__dirname,'/../test/data/'+claContents["text"])

      //read the text content of the CLA asynchronously as a utf8 encoded string and then pass
      //data into callbackURL so that the markdown text gets parsed to html
      //replace the ["text"] property in the CLAContents json with the actual html content of
      //CLA
      return fs.readFile(textPath,'utf8',function(err, data){
        for(property in claContents){
          if(property == "text"){
            claContentsParsed["text"] = converter.makeHtml(data)
          } else {
            claContentsParsed[property]=claContents[property]
          }
        }
        //render the CLA view
        res.render('CLA', {"title":"Sign CLA", "loggedIn":loggedIn, "profilePicture":profilePicture, "claContents":claContentsParsed, "postURL":postURL})
      })

    })
})

//route to post data from form to...pass the claname, reponame and pullRequestSha as url Parameters
router.post("/:claName/:repoName/:pullRequestSha", function(req, res, next){
  return databaseStore.storeSignedCLADetailsAsync(req.user.id, req.params.claName, req.body)
    .then(function(responses){
      return gitHubInterface.setPullRequestStatusAsync(req.params.repoName, req.params.pullRequestSha,
          { "state":"success",
            "description":"User has signed the relevant CLA version ( "+ claContents["name"] +" )",
            "target_url":"https://localhost:3000",
            "context":"CLATracker"
          },
          process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
        .then(function(response){
          if(response == "status set"){
            //redirect to homepage
            res.redirect("/")
          }else{
            res.render('alert',{message:"you have signed the CLA but there was a problem updating the pullRequestStatus on github. Please resubmit your pull request"})
          }
        })
    })
})

module.exports=router
