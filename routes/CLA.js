// express modules
var express = require('express');
var router = express.Router();

// modules for accessing database and calling github API
var databaseStore = require("../models/DatabaseStore")
var gitHubInterface = require("../models/GitHubInterface")

// modules for converting markdown to html
var showdown = require('showdown')
var converter = new showdown.Converter()

// modules for reading CLA files
var fs = require('fs');
var path = require('path')


// ******* GET ROUTE **********
// displays the CLA form to be filled in
// the URL contains 3 parameters claName, repoName, pullRequestSha
// repoName and pullRequestSha are needed so we can update the relevant pull request status on githubs
router.get("/:claName/:repoName/:pullRequestSha", function(req, res, next){ 
  
  //if user is not logged in reroute to login and return
  if(req.user==null){
    res.redirect('/login/github');
    return
   }

  //if user is logged in
  let claName = req.params.claName;
  let repoName = req.params.repoName;
  let pullRequestSha = req.params.pullRequestSha;
  let userId = req.user["id"];
  let profilePicture = req.user["githubPicture"];
  let alertMessage;

  //check if user has already signed the CLA --- it is possible that the user has
  //signed this CLA since pull request was made generating a link to this page....
  //so check for signing again here
  return databaseStore.checkCLASignedAsync(userId,claName)
    .then(function(signed){
      //if user has signed return and update pull request status, alert user with message
      if(signed== true){
        return updatePullRequestStatusToSignedAsync(repoName, pullRequestSha, claName)
        .then(function(response){
          if(response == "status set"){
            alertMessage = "You have already signed the relevant CLA since submitting your pull request, the pull request status on Github has now been updated"
          }else{
            alertMessage = "You have already signed the relevant CLA since submitting your pull request, however there was a problem updating the pull request status on Github. Please resubmit your pull request"
          }
          renderAlert(res, profilePicture, alertMessage);
        })
      }

      //if user hasn't signed go ahead and render a cla form to fill in
      return renderClaForm(res, profilePicture, repoName,pullRequestSha,claName);
    })
})

//********* POST ROUTE ******************/
//route to post data from form to...pass the claname, reponame and pullRequestSha as url Parameters
router.post("/:claName/:repoName/:pullRequestSha", function(req, res, next){
  let userId = req.user.id;
  let profilePicture = req.user.githubPicture;
  let repoName = req.params.repoName
  let claName = req.params.claName
  let pullRequestSha = req.params.pullRequestSha
  let formData = req.body
  let alertMessage;

  return databaseStore.storeSignedCLADetailsAsync(userId, claName, formData)
    .then(function(responses){
      return updatePullRequestStatusToSignedAsync(repoName, pullRequestSha, claName)
    })         
    .then(function(response){
      if(response == "status set"){
        //redirect to homepage
        res.redirect("/")
      }else{
        alertMessage = "you have signed the CLA but there was a problem updating the pullRequestStatus on github. Please resubmit your pull request"
        renderAlert(res, profilePicture,alertMessage);
      }
    })
})

//**************HELPER FUNCTIONS*********************/

function updatePullRequestStatusToSignedAsync(repoName, pullRequestSha, claName){
  return gitHubInterface.setPullRequestStatusAsync(repoName, pullRequestSha,
    { "state":"success",
      "description":"User has signed the relevant CLA version ( "+ claName +" )",
      "target_url":"https://localhost:3000",
      "context":"CLATracker"
    },
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
}

function renderAlert(res, profilePicture, message){
  res.render('alert',{"title":"Alert", "loggedIn":true, "profilePicture":profilePicture, message:message})
}

function renderClaForm(res,profilePicture, repoName, pullRequestSha, claName){
  //when we post the CLA form back to server we want to keep track of
  //claName and the repoName and pull requestsha from this route Parameters
  //so we can trigger an update to the pullrequest status on github once the
  //cla is signed...so create a link that parses these parameters in url
  //encoding any special characters
  let postURL = "/CLA/" + encodeURIComponent(claName) + "/" + encodeURIComponent(repoName) + "/" + encodeURIComponent(pullRequestSha)
      
  //if in test mode pick up the test CLA files otherwise pick up the development version of files...locations set in local config files
  let claFilesPath = path.join(__dirname,'../'+process.env.CLA_FILES_PATH);
  let claContentsPath = claFilesPath+'/'+claName.replace(/\s/g,'')+'.json' //remove all whitespace from claName 
      
  //Read the claContents .json file into an object asynchronously...fs doesn't use promises it uses callbacks
  fs.readFile(claContentsPath,'utf8', function(err, claContentsData){
    let claContents = JSON.parse(claContentsData)

    //then read the text content of the CLA asynchronously as a utf8 encoded string and then pass
    //data into callbackURL so that the markdown text gets parsed to html
    //replace the ["text"] property in the CLAContents json with the actual html content of CLA
    let claTextPath = claFilesPath+'/'+claContents["text"]
    fs.readFile(claTextPath,'utf8',function(err, textData){
      let claContentsParsed=claContents
      claContentsParsed["text"] = converter.makeHtml(textData)
          
      res.render('CLA', {"title":"Sign CLA", "loggedIn":true, "profilePicture":profilePicture, "claContents":claContentsParsed, "postURL":postURL})
    })
  })
}

module.exports=router
