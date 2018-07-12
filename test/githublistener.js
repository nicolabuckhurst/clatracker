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
var testpayloadCORRUPT = require('./data/testPayloadCORRUPT')
var testpayloadMember = require('./data/testPayloadMember')

//access extra chaiHttp utilities not as stadard in chai export
chai.use(chaiHttp);
chai.use(chai_sinon);

describe("/githublistener POST",function(){

  describe("received a valid payload from github", function(){

    it("should respond with a 200 if all checks pass", function(){
      return chai.request(app).post('/githublistener')
      .type("application/json")
      .set('X-Hub-Signature',"abc")
      .send(testpayloadContributor)
      .then(function(res){
        expect(res.status).to.equal(200);
      })
      .catch(function(err){
          throw err;
      })
    })

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


  describe("pull request opened by org member", function(){
    before("set a spy on database.checkCLA()", function(){
      sinon.spy(databaseStore, "checkCLAAsync")
    })

    after("database flush and remove spy", function(){
      return databaseStore.resetDatabaseAsync()
        .then(function(){
          databaseStore.checkCLAAsync.restore();
        })
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
    it("should check for contributer in database")

    describe("member already signed a cla",function(){
      it("should respond with 200 and send a status update to github that CLA is signed", function(){

      })
    })

    describe("member not signed a cla",function(){
      it("should send a 200 and send a status update to github with link to CLA")
    })
  })
})
