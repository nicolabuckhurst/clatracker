var config = require("../config.js");

var chai = require("chai");

var expect = require("chai").expect;

//run config file to set up env variables pointing to test database
var databaseStore = require("../models/DatabaseStore");

describe("Database Interactions", function(){

  describe("Writing a new contributer details to the database", function(){
    it("stores a new contriubutors details to the database against githubId", function(){

      //dummy test contributor details
      let testGithubId ="12345";
      let testUserDetails = {"login":"testuser"}

      //As databaseStore.storeContributorDetailsAsync returns a promise you must
      //return this promise to the describe function otherwise mocha will not wait
      //for promise to resolve and test will always instantly pass as green
      return databaseStore.storeContributorDetailsAsync(testGithubId,testUserDetails)
        //check the response from writing data to database is "OK"
        .then(function(res){
          console.log(res);
          expect(res).to.equal("OK");
          return databaseStore.retrieveContributorDetailsAsync(testGithubId)
        })
        //check that when you read user details back the emails match
        .then(function(userDetailsFromDatabase){
          console.log(userDetailsFromDatabase);
          expect(userDetailsFromDatabase["login"]).to.equal(testUserDetails["login"]);
        })

    })
  })


  describe("Add a new CLA agreement to list of users CLAs", function(){
    it("adds a new version number to a set of CLAs associated with githubId", function(){

    })
  })

})


  //describe "Looking up a user in redis"


  //describe "Get a list of all users who've signed CLAs"
