var config = require("../config.js");

var chai = require("chai");

var expect = require("chai").expect;

var githubInterface = require("../models/GitHubInterface")
var testGithubStatusParameters = require("./data/testGithubStatusParameters")
var testPayloadContributor = require("./data/testPayloadContributor")
var githubListener = require("../routes/githublistener")

describe("it successfully sets a github status when sent a valid datapayload object and status parameters", function(){
  it("returns status set", function(){
      //reformat the raw payload data as we do before we actually submit a create status req to Github
      var payloadData={};
      payloadData["login"]=testPayloadContributor["pull_request"]["user"]["login"];
      payloadData["id"] =testPayloadContributor["pull_request"]["user"]["id"];
      payloadData["authorAssociation"]=testPayloadContributor["pull_request"]["author_association"];
      payloadData["repoName"] = testPayloadContributor["repository"]["full_name"];
      payloadData["pullRequestSha"] = testPayloadContributor["pull_request"]["head"]["sha"];
      githubInterface.setPullRequestStatusAsync(payloadData, testGithubStatusParameters)
      .then(function(response){
        expect(response).to.equal("status set")
      })
  })
})
