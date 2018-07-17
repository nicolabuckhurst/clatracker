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
    "full_name":process.env.GITHUB_TEST_REPO_FULL_NAME
  }
}

module.exports=testPayloadContributor
