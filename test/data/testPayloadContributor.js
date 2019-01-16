var testPayloadContributor =
{
  "pull_request":{
    "user":{
      "login":"testUser",
      "id":123456
    },
    "head":{
      "sha":process.env.GITHUB_PULL_REQ_SHA
    },
    "author_association":"CONTRIBUTOR"
  },
  "repository":{
    "id":process.env.GITHUB_TEST_REPO_ID,
    "full_name":process.env.GITHUB_TEST_REPO_FULLNAME
  }
}

module.exports=testPayloadContributor
