var fetch = require('node-fetch')

var GitHubInterface = {

  //arguments are full repo name, the pull request sha ( which you can get from the payload from github),
  //the github personal access token
  //status object that defines all the fields and their values for the status of the pull request...see
  //github documentation https://developer.github.com/v3/repos/statuses/?#
  setPullRequestStatusAsync: function(repoName, pullRequestSha, statusObject, githubPersonalAccessToken){
    //the url to set a status on a pull request is constructed as
    //https://api.github.com/repos/:owner/:repo/statuses/:sha sha is the sha of the pull_request
    //the argument repoName is the full repository name so equivilent to owner/repo
    //send a personal access token for a user that has push access in the repo ... if this
    //application is receiving webhooks from lots of repos in an organisation create a user
    //with push access on all the repos and use their personal access token
    //Header Accept set as specified in github docs
    //Header Content-Type set as in github docs
    //body contains parameters of new status as stringified JSON as per Fetch Documentation
    //fetch automatically deals with any spaces and slashes etc in URL Parameters and encodes them appropriately

    return fetch("https://api.github.com/repos/"+repoName+"/statuses/"+pullRequestSha,
          {
            method:"post",
            headers:{"Accept":"application/vnd.github.v3+json",
                    "Content-Type":"application/json",
                    "Authorization": "token "+githubPersonalAccessToken},
            body:JSON.stringify(statusObject)
          }
        )
    .then(function(githubresponse){
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
  },

  findUserId: function(githubUsername, githubPersonalAccessToken){
    return fetch("https://api.github.com/users/"+githubUsername,
          {
            method:"get",
            headers:{"Content-Type":"application/json",
                      "Authorization":"token "+githubPersonalAccessToken}
          }
        )
        .then(response => response.json())
        .then(data => {
          return data.id
        })
  },

  findRepoId: function(githubFullRepoName, githubPersonalAccessToken){
    return fetch("https://api.github.com/repos/"+githubFullRepoName,
          {
            method:"get",
            headers:{"Content-Type":"application/json",
                      "Authorization":"token "+githubPersonalAccessToken}
          }
        )
        .then(response => response.json())
        .then(data => {
          return data.id
        })
  }


}

module.exports = GitHubInterface
