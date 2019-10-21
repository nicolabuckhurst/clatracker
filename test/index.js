var expect = require("chai").expect;
var chaiHttp = require("chai-http");
var sinon = require("sinon");
var chai_sinon = require("chai-sinon");
var chai = require("chai")

chai.use(chaiHttp);
chai.use(chai_sinon);

var app = require("../app");

var express = require("express")
var response = express.response


describe('**Index Page Tests', function () {

  describe('if user is logged in', function () {
    var agent;

    before("login test user and set spies", function () {
      agent = chai.request.agent(app) //agent is built on superagent it makes http requests and maintains any cookie info sent back for 
      //subsequent tests

      return agent.post('/login/testlogin')
        .type('form')
        .send({ username: "username", password: "password" }) //the test login strategy is built as a passport localstrategy..this expects
        //2 arguments that would normally be sent via a form for username and password
        //we wont use these as we are not actually authenticating test user just automatically
        //logging them on and creating a session. However we need to send dummy strings or otherwise
        //passport rejects this request..type can be form or json...techically could leave out .type()
        //nd defaults to json
        .then(function () {
          sinon.spy(response, "render") //set spies on functions
        })
        .catch(function (err) {
          throw err;
        })
    })

    it('should render the index view', function () {
      return agent.get('/')
        .then(function (res) {
          expect(res.status).to.equal(200);
          expect(response.render).to.have.been.calledWithMatch("index")
        })
        .catch(function (err) {
          throw err;
        })
    })

    after('close agent', function () {
      agent.close()
    })

  })


  describe('if user is not logged in', function () {
    let request = chai.request(app)

    it('should render the index view', function () {
      return request.get('/')
        .then(function (res) {
          expect(res.status).to.equal(200);
          expect(response.render).to.have.been.calledWithMatch("index")
        })
        .catch(function (err) {
          throw err;
        })
    })
  })

})