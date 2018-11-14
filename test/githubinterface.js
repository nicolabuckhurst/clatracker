var expect = require("chai").expect;

var githubInterface = require("../models/GitHubInterface")
var testGithubStatusParameters = require("./data/testGithubStatusParameters")
var testPayloadContributor = require("./data/testPayloadContributor")
var githubListener = require("../routes/githublistener")
var testGithubUsername = "nicolabuckhurst"
var testGithubId = 2686508


describe("it successfully sets a github status when sent a valid datapayload object and status parameters", function(){

  it("returns status set", function(){
      return githubInterface.setPullRequestStatusAsync(testPayloadContributor["repository"]["full_name"],testPayloadContributor["pull_request"]["head"]["sha"], testGithubStatusParameters, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
        .then(function(response){
          expect(response).to.equal("status set")
        })
  })
})

describe("it successfully finds a github ID from a github username", function(){

  it("returns the correct githubId", function(){
    return githubInterface.findGithubId(testGithubUsername)
      .then(function(response){
        expect(response).to.equal(testGithubId)
      })
  })

})
