var chai = require("chai");
var expect = require("chai").expect;

var databaseStore = require("../models/DatabaseStore");

//simple test data..to test reading and writing from database..no need to use full testPayload from github
var testGithubId ="12345";
var testUserDetails = {"login":"testuser"}
var testCLA1 = "version 1"
var testCLA2 = "version 2"
var testCLADetails = {"date signed":"1/7/2018", "name":"Test User","email":"Test email"};

describe("Test Database Interactions", function(){

  afterEach("flush database", function(){
    return databaseStore.resetDatabaseAsync();
  })

  describe("Write a new contributor details to the database", function(){

    it("stores a new contriubutors details against githubId and reads them back", function(){
      //As databaseStore.storeUserDetailsAsync returns a promise you must
      //return this promise to the describe function otherwise mocha will not wait
      //for promise to resolve and test will always instantly pass as green
      return databaseStore.storeUserDetailsAsync(testGithubId,testUserDetails)
        //check the response from writing data to database is "OK"
        .then(function(res){
          expect(res).to.equal("OK");
          return databaseStore.retrieveUserDetailsAsync(testGithubId)
        })
        //check that when you read user details back the emails match
        .then(function(userDetailsFromDatabase){
          expect(userDetailsFromDatabase["login"]).to.equal(testUserDetails["login"]);
        })
    })

  })

  describe("check if user exists in database", function(){

    before("add a dummy user before positive test", function(){
      return databaseStore.storeUserDetailsAsync(testGithubId, testUserDetails)
    })

    it("returns true if user exists in database", function(){
      return databaseStore.checkUserAsync(testGithubId)
        .then(function(exists){
          expect(exists).to.equal(true);
        })
    })

    it("returns false if user doesn't exist in database", function(){
      return databaseStore.checkUserAsync(testGithubId)
        .then(function(exists){
          expect(exists).to.equal(false);
        })
    })

  })

  describe("Add a new CLA agreement to list of users CLAs", function(){

    it("adds a new version number to a set of CLAs associated with githubId", function(){
    let promises =[];
      promises.push(databaseStore.storeSignedCLADetailsAsync(testGithubId, testCLA1, testCLADetails));
      promises.push(databaseStore.storeSignedCLADetailsAsync(testGithubId, testCLA2, testCLADetails));
      return Promise.all(promises)
        .then(function(redisResponses){ //you get an array here as each promise in promises resolves to a result
          expect(redisResponses).to.eql([[1,"OK"],[1,"OK"]]); //use .eql not equal when comparing arrays
          return databaseStore.retrieveUserCLAVersions(testGithubId);
        })
        .then(function(ArrayOfCLAVersions){
          console.log(ArrayOfCLAVersions);
          expect(ArrayOfCLAVersions).to.have.members([testCLA1, testCLA2]);
          return databaseStore.checkCLASignedAsync(testGithubId, testCLA2)
        })
        .then(function(signed){
          expect(signed).to.equal(true);
           return databaseStore.checkCLASignedAsync(testGithubId, "version 3");
        })
        .then(function(signed){
          expect(signed).to.be.equal(false);
          return databaseStore.retrieveSignedCLADetailsAsync(testGithubId, testCLA1)
        })
        .then(function(CLADetails){
          expect(CLADetails).to.eql(testCLADetails);
        })
    })
  })

  describe("Set the CLA version requirement for a repository", function(){

    it("adds a new key:value pair to the CLARequirements key in database", function(){
      return databaseStore.storeCLARequirementsAsync("cla-tracker/dummydata", "version 1")
        .then(function(redisResponse){
          expect(redisResponse).to.equal(1)
          return databaseStore.retrieveCLARequirementsAsync("cla-tracker/dummydata")
        })
        .then(function(version){
          expect(version).to.equal("version 1")
        })
    })
  })

  describe("return a list of CLA requirements for repositories", function(){

    before("add a new key:value pair to CLAReequirements key in database", function(){
      return databaseStore.storeCLARequirementsAsync("cla-tracker/dummydata", "version 1")
    })

    it("returns a list of CLA requirements", function(){
      return databaseStore.retrieveCLARequirementListAsync()
        .then(function(list){
          expect(list).to.eql({"cla-tracker/dummydata":"version 1"})
      })
    })
  })

  describe("store and return the CLA details entered by a user for a CLA", function(){

    it("sets user details stored against a CLA and retrieves them successfully", function(){
      return databaseStore.storeSignedCLADetailsAsync("12345", "TestCLA", {"full name":"test user", "email":"testemail"})
        .then(function(redisResponses){
          expect(redisResponses).to.eql([1,"OK"])
          return databaseStore.retrieveSignedCLADetailsAsync("12345", "TestCLA")
        })
        .then(function(claDetails){
          expect(claDetails).to.eql({"full name":"test user", "email":"testemail"})
        })
    })
  })

})
