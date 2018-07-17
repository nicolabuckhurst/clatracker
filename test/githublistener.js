var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = require("chai").expect;
var sinon = require("sinon");
var chai_sinon = require("chai-sinon");

var app = require("../app");

var databaseStore = require("../models/DatabaseStore");

//do not read in the .json file using requires() ...this checks the syntax for
//the .json file and throws an error when you try and read the corrupt json file
var testpayloadContributor = require('./data/testPayloadContributor')
console.log("testpayloadContributor"+JSON.stringify(testpayloadContributor))
var testpayloadCORRUPT = {}
var testpayloadMember = require('./data/testPayloadMember')

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
        sinon.spy(databaseStore, "checkCLAAsync")
      })

      after("remove spy", function(){
        databaseStore.checkCLAAsync.restore();
      })

      it("it should respond with a 200 and not call database", function(){
        return chai.request(app).post('/githublistener')
        .type("application/json")
        .set('X-Hub-Signature', "")
        .send(testpayloadMember)
        .then(function(res){
          expect(res.status).to.equal(200);
          expect(databaseStore.checkCLAAsync).to.not.have.been.called;
        })
        .catch(function(err){
            throw err;
        })
      })
    })

    describe("pull request opened by non member", function(){

      describe("if contributor has signed relevant CLA", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.setCLARequirementsAsync("cla-tracker/dummydata", "version 1"))
          promises.push(databaseStore.storeContributorDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.addCLAVersionAsync("123456","version 1",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
                sinon.spy(databaseStore, "checkCLAAsync")
                sinon.spy(databaseStore, "checkCLARequirementsAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.checkCLARequirementsAsync.restore()
          databaseStore.checkCLAAsync.restore()
        })

        it("it should call checkCLARequirementsAsync, checkCLAAsync, send a status to github and respond with status 201 if user has signed CLA", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(201);
            expect(databaseStore.checkCLARequirementsAsync).to.have.been.called;
            expect(databaseStore.checkCLAAsync).to.have.been.called;
            expect(/*put in status test*/)
          })
          .catch(function(err){
            throw err;
          })
        })
      })

      describe("if contributor has NOT signed relevant CLA", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.setCLARequirementsAsync("cla-tracker/dummydata", "version 1"))
          promises.push(databaseStore.storeContributorDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.addCLAVersionAsync("123456","version 2",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
              sinon.spy(databaseStore, "checkCLAAsync")
              sinon.spy(databaseStore, "checkCLARequirementsAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.checkCLARequirementsAsync.restore()
          databaseStore.checkCLAAsync.restore()
        })

        it("it should call checkCLARequirementsAsync, checkCLAAsync, send a status to github and respond with status 202 if user has NOT signed CLA", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(202);
            expect(databaseStore.checkCLARequirementsAsync).to.have.been.called;
            expect(databaseStore.checkCLAAsync).to.have.been.called;
            expect()
            expect(/*put in status test*/)
          })
          .catch(function(err){
            throw err;
          })
        })
      })

      describe("if CLA not required", function(){

        before("set spies and add dummy data to database to database", function(){
          let promises = []
          promises.push(databaseStore.storeContributorDetailsAsync("123456",{"login":"testUser"}))
          promises.push(databaseStore.addCLAVersionAsync("123456","version 1",{"email":"testemail"}))
          return Promise.all(promises)
            .then(function(){
              sinon.spy(databaseStore, "checkCLAAsync")
              sinon.spy(databaseStore, "checkCLARequirementsAsync")
            })
          })

        after("remove spies", function(){
          databaseStore.checkCLARequirementsAsync.restore()
          databaseStore.checkCLAAsync.restore()
        })

        it("it should call checkCLARequirementsAsync, checkCLAAsync, send a status to github and respond with status 203 CLA not required", function(){
          return chai.request(app).post('/githublistener')
          .type("application/json")
          .set('X-Hub-Signature', "")
          .send(testpayloadContributor)
          .then(function(res){
            expect(res.status).to.equal(203);
            expect(databaseStore.checkCLARequirementsAsync).to.have.been.called;
            expect()
            expect(/*put in status test*/)
          })
          .catch(function(err){
            throw err;
          })
        })
      })

    })

  })

})
