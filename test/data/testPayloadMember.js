//REQUIRED CONFIG
//Run a development redis server locally (redis-server command will as default run this on
//localhost port:6379)

//Run a second redis server instance for tests....redis does not allow multiple
//databases on same port so use redis-server --port xxxx

//set env variables to expose your redis servers REDIS_DEV_URL (eg. redis://localhost:6379)
//and REDIS_TEST_URL (redis://localhost:xxxx)

//ensure you are running this app on an externally visable IP address

//create a test repo on GITHUB ensuring you have write access store the full_name (eg orgname/reponame)  of
//this repository as env variable GITHUB_TEST_REPO_FULL_NAME

//go to repository settings and set up a webhook for pull_requests to this app incl a secret

//store the secret as env variable WEBHOOK_SECRET_TOKEN

//Go to Github user settings and then developer setting and create a personal access access_token
//store this token as environment variable GITHUB_PERSONAL_ACCESS_TOKEN

//OPTIONAL CONFIG
//To run the githubinterface tests...you will require a dummy pull-request
//only required if you are changing GitHubInterface module
//create a pull_request on test repository

//go into the webhook setup page again and check github made a successful delivery and
//find ["pull_request"]["head"]["sha"]in the delivered payload
//store this sha as env variable GITHUB_PULL_REQ_SHA [[This will ONLY be used when running tests]]

//set environment variable RUN_GITHUBINTERFACE_TESTS = 1


//***IN TEST MODE WE DO NOT CHECK THE XHUBSIGNATURE FROM GITHUB EVERYTIME WE SIMULATE
//RECEIVING A WEBHOOK PAYLOAD......we test the verifySignature module seperately and
//you only really need to include these tests if you change this module.

//To run the verifysignature tests you will need to create a test xhubsignature sha.
//only required if changing verifySignature module
//run generateTestHubSignature from command line and copy the result into an env variable
//VERIFICATION_TEST_XHUBSIGNATURE

//Set environment variable RUN_VERIFYSIGNATURE_TESTS = 1

var testPayloadMember =
{
  "pull_request":{
    "user":{
      "login":"testUser",
      "id":123456
    },
    "head":{
      "sha":process.env.GITHUB_PULL_REQ_SHA
    },
    "author_association":"MEMBER"
  },
  "repository":{
    "id":process.env.GITHUB_TEST_REPO_ID,
    "full_name":process.env.GITHUB_TEST_REPO_FULLNAME
  }
}

module.exports = testPayloadMember
