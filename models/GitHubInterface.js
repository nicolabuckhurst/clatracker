var fetch = require('node-fetch')

var GitHubInterface = {

  //takes the payloadData object created from the webhook request and an object
  //with all the parameters for the github Status parameters
  setPullRequestStatusAsync: function(repoName, pullRequestSha, statusObject){
    //the url to set a status on a pull request is constructed as
    ///https://api.github.com/repos/:owner/:repo/statuses/:sha sha is the sha of the pull_request
    //send a personal access token for a user that has push access in the repo ...if this
    //application is receiving webhooks from lots of repos in an organisation create a user
    //with push access on all the repos and use their oersonal access token
    //Header Accept set as specified in github docs
    //Header Content-Type set as in github docs
    //body contains parameters of new status as stringified JSON as per Fetch Documentation
    //fetch automatically deals with any spaces and slashes etc in URL Parameters and encodes them appropriately
    console.log("https://api.github.com/repos/"+repoName+"/statuses/"+pullRequestSha)
    return fetch("https://api.github.com/repos/"+repoName+"/statuses/"+pullRequestSha,
          {
            method:"post",
            headers:{"Accept":"application/vnd.github.howard-the-duck-preview+json",
                      "Content-Type":"application/json",
                      "Authorization": "token "+process.env.GITHUB_PERSONAL_ACCESS_TOKEN},
            body:JSON.stringify(statusObject)
          }
        )
    .then(function(githubresponse){
      console.log(githubresponse.status)

        if(githubresponse.status == "201"){
          return "status set"
        } else {
          return "status not set"
        }
      },
      function(error){
        //in case of error log error and return message "status could not be set"
        console.log(error)
        return "status could not be set"
      }
    )
  }

}

module.exports = GitHubInterface
