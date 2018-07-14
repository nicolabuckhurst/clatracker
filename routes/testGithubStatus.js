var express = require('express');
var router = express.Router();

var fetch = require('node-fetch');

router.get('/', function(req, res, next){

  fetch("https://api.github.com/repos/cla-tracker/dummydata/commits/6e08351a0afb9daad5686cdac4b913b2e19a6bb1/statuses?access_token="+process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
          {headers:{"Accept":"application/vnd.github.howard-the-duck-preview+json"}})
    .then(function(githubresponse){
      console.log(githubresponse.headers)
      return githubresponse.json()
      })
    .then(function(githubresponse){
      console.log("body of response"+githubresponse)
    })
})


router.get('/setTestStatus', function(req,res,next){
  fetch("https://api.github.com/repos/cla-tracker/dummydata/statuses/6e08351a0afb9daad5686cdac4b913b2e19a6bb1",
          {
            method:"post",
            headers:{"Accept":"application/vnd.github.howard-the-duck-preview+json",
                      "Content-Type":"application/json",
                      "Authorization": "token "+process.env.GITHUB_PERSONAL_ACCESS_TOKEN},
            body:JSON.stringify({"state":"pending","description":"test3"})
          }
        )
    .then(function(githubresponse){
      console.log(githubresponse.headers)
      return githubresponse.json()
      })
    .then(function(githubresponse){
      console.log("body of response"+JSON.stringify(githubresponse))
    })
})

router.get('/getCollaborators', function(req, res, next){
  fetch("https://api.github.com/repos/cla-tracker/dummydata/collaborators?access_token="+process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
          {
            headers:{"Accept":"application/vnd.github.hellcat-preview+json"}
          }
        )
    .then(function(githubresponse){
      console.log(githubresponse.headers)
      return githubresponse.json()
      })
    .then(function(githubresponse){
      console.log("body of response"+JSON.stringify(githubresponse))
    })
})

module.exports = router;
