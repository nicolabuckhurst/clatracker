var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = require("chai").expect;
var sinon = require("sinon");
var chai_sinon = require("chai-sinon");

var app = require("../app");

var databaseStore = require("../models/DatabaseStore");
var gitHubInterface = require("../models/GitHubInterface");

//do not read in the .json file using requires() ...this checks the syntax for
//the .json file and throws an error when you try and read the corrupt json file
var testpayloadContributor = require('./data/testPayloadContributor')
var testpayloadCORRUPT = {}
var testpayloadMember = require('./data/testPayloadMember')

//use bluebird promises rather than native promises...more familiar to me
var Promise= require("bluebird")

//access extra chaiHttp utilities not as stadard in chai export
chai.use(chaiHttp);
chai.use(chai_sinon);

describe("/githublistener POST",function(){

  afterEach("flush the database", function(){
    return databaseStore.resetDatabaseAsync()
  })

  describe("received an invalid payload from github", function(){

    it("should respond with a 500 if X-hub-signature header isnt present ", function(){
      return chai.request(app).post('/githublistener')
      .type("application/json")
      .send(testpayloadContributor)
      .then(function(res){
        expect(res.status).to.equal(500);
      })
      .catch(function(err){
          throw err;
      })
    })

    it("should respond with a 500 if content-type isn't application/json", function(){
      return chai.request(app).post('/githublistener')
      .type("application/x-www-form-urlencoded")
      .set('X-Hub-Signature', "abc")
      .send(testpayloadContributor)
      .then(function(res){
        expect(res.status).to.equal(500);
      })
      .catch(function(err){
          throw err;
      })
    })

    it("should respond with a 500 if payload doesnt contain required fields", function(){
      return chai.request(app).post('/githublistener')
      .type("application/json")
      .set('X-Hub-Signature', "abc")
      .send(testpayloadCORRUPT)
      .then(function(res){
        expect(res.status).to.equal(500);
      })
      .catch(function(err){
          throw err;
      })
    })
  })


  describe("received a valid payload from github", function(){

    describe("pull request opened by org member", function(){

      before("set a spy on database.checkCLA()", function(){
        sinon.spy(databaseStore, "checkCLASignedAsync")
      })

      after("remove spy", function(){
        databaseStore.checkCLASignedAsync.restore();
      })

      it("it should respond with a 200 and not call database", function(){
        return chai.request(app).post('/githublistener')
        .type("application/json")
        .set('X-Hub-Signature', "")
        .send(testpayloadMember)
        .then(function(res){
          expect(res.status).to.equal(200);
          expect(databaseStore.checkCLASignedAsync).to.not.have.been.called;
        })
        .catch(function(err){
            throw err;
        })
      })
    })
    
    describe("pull request opened by whitelisted non member", function(){

      before("set spies and add dummy data to database to database", function(){
        let promises = []
        promises.push(databaseStore.addUserToWhitelist("123456","139762263"))
        return Promise.all(promises)
          .then(function(){
            sinon.spy(databaseStore,"checkIfWhitelisted")
            sinon.spy(databaseStore, "retrieveCLARequirementsAsync" )
          })
        })

      after("remove spies", function(){
        databaseStore.checkIfWhitelisted.restore()
        databaseStore.retrieveCLARequirementsAsync.restore()
      })

      it("should call checkIfWhitelisted and not retrieve CLA requirement and respond with a 200", function(){
        return chai.request(app).post('/githublistener')
        .type("application/json")
        .set('X-Hub-Signature', "")
        .send(testpayloadContributor)
        .then(function(res){
          expect(res.status).to.equal(200);
          expect(databaseStore.checkIfWhitelisted).to.have.been.called;
          expect(databaseStore.retrieveCLARequirementsAsync).to.not.have.been.called;
        })
        .catch(function(err){
            throw err;
        })
      })

    })



    describe("pull request opened by non whitelisted non member", function(){

      describe("if contributor has signed relevant CLA", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.storeCLARequirementsAsync("139762263", "version 1"))
          promises.push(databaseStore.storeUserDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.storeSignedCLADetailsAsync("123456","version 1",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
                sinon.spy(databaseStore, "checkCLASignedAsync")
                sinon.spy(databaseStore, "retrieveCLARequirementsAsync")
                sinon.spy(gitHubInterface, "setPullRequestStatusAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.retrieveCLARequirementsAsync.restore()
          databaseStore.checkCLASignedAsync.restore()
          gitHubInterface.setPullRequestStatusAsync.restore()
        })

        it("it should call retrieveCLARequirementsAsync, checkCLASignedAsync, send a status to github and respond with status 201 if user has signed CLA", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(201);
            expect(databaseStore.retrieveCLARequirementsAsync).to.have.been.called;
            expect(databaseStore.checkCLASignedAsync).to.have.been.called;
            expect(gitHubInterface.setPullRequestStatusAsync).to.have.been.called;
          })
          .catch(function(err){
            throw err;
          })
        })
      })

      describe("if contributor has NOT signed relevant CLA", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.storeCLARequirementsAsync("139762263", "version 1"))
          promises.push(databaseStore.storeUserDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.storeSignedCLADetailsAsync("123456","version 2",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
              sinon.spy(databaseStore, "checkCLASignedAsync")
              sinon.spy(databaseStore, "retrieveCLARequirementsAsync")
              sinon.spy(gitHubInterface, "setPullRequestStatusAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.retrieveCLARequirementsAsync.restore()
          databaseStore.checkCLASignedAsync.restore()
          gitHubInterface.setPullRequestStatusAsync.restore()
        })

        it("it should call retrieveCLARequirementsAsync, checkCLASignedAsync, send a status to github and respond with status 202 if user has NOT signed CLA", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(202);
            expect(databaseStore.retrieveCLARequirementsAsync).to.have.been.called;
            expect(databaseStore.checkCLASignedAsync).to.have.been.called;
            expect(gitHubInterface.setPullRequestStatusAsync).to.have.been.called;
          })
          .catch(function(err){
            throw err;
          })
        })
      })

      describe("if CLA not required", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.storeUserDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.storeSignedCLADetailsAsync("123456","version 1",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
              sinon.spy(databaseStore, "checkCLASignedAsync")
              sinon.spy(databaseStore, "retrieveCLARequirementsAsync")
              sinon.spy(gitHubInterface, "setPullRequestStatusAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.retrieveCLARequirementsAsync.restore()
          databaseStore.checkCLASignedAsync.restore()
          gitHubInterface.setPullRequestStatusAsync.restore()
        })

        it("it should call retrieveCLARequirementsAsync, checkCLASignedAsync, send a status to github and respond with status 203 CLA not required", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(203);
            expect(databaseStore.retrieveCLARequirementsAsync).to.have.been.called;
            expect(gitHubInterface.setPullRequestStatusAsync).to.have.been.called;
          })
          .catch(function(err){
            throw err;
          })
        })
      })

    })

  })

})
