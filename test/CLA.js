var expect = require("chai").expect;
var chaiHttp = require("chai-http");
var sinon = require("sinon");
var chai_sinon = require("chai-sinon");
var chai = require("chai")

chai.use(chaiHttp);
chai.use(chai_sinon);

var app = require("../app");

var databaseStore = require("../models/DatabaseStore");
var githubInterface = require("../models/GitHubInterface")
var express = require("express")
var response = express.response

var testData = require("./data/testPayloadMember.js")
var testUserId = testData["pull_request"]["user"]["id"]
var testRepoName = testData["repository"]["full_name"]
var testPullRequestSha = testData["pull_request"]["head"]["sha"]
var testCLAName = "Apache v2.0"
var testCLAUserDetails= {Name:"testuser"} 

describe("**CLA Form tests**  (routes called with valid claname, reponame and pullrequestsha)", function(){
    var agent;

    beforeEach("login test user and set spies", function(){
        agent = chai.request.agent(app) //agent is built on superagent it makes http requests and maintains any cookie info sent back for 
                                        //subsequent tests

        return agent.post('/login/testlogin') 
            .type('form')
            .send({username:"username", password:"password"}) //the test login strategy is built as a passport localstrategy..this expects
                                                              //2 arguments that would normally be sent via a form for username and password
                                                              //we wont use these as we are not actually authenticating test user just automatically
                                                              //logging them on and creating a session. However we need to send dummy strings or otherwise
                                                              //passport rejects this request..type can be form or json...techically could leave out .type()
                                                              //nd defaults to json
            .then(function(res){
                sinon.spy(response,"render") //set spies on functions
                sinon.spy(githubInterface,"setPullRequestStatusAsync")
                sinon.spy(databaseStore, "storeSignedCLADetailsAsync")
                sinon.spy(response,"redirect")
             })
             .catch(function(err){
                 throw err;
             })
    })
    
    describe("1. User has signed CLA since url for form was generated", function(){
        before("add database data", function(){
            var promises =[]
               // promises.push(databaseStore.storeUserDetailsAsync(testUserId, testUserDetails)) //store test data in test database
                promises.push(databaseStore.storeCLARequirementsAsync(testRepoName, testCLAName))
                promises.push(databaseStore.storeSignedCLADetailsAsync(testUserId, testCLAName, testCLAUserDetails))
                return Promise.all(promises)
        })

        it("should call function to set pullrequest status an alert", function(){
            return agent.get('/CLA/'+encodeURIComponent(testCLAName)+'/'+encodeURIComponent(testRepoName)+'/'+encodeURIComponent(testPullRequestSha))
            .then(function(res){
                 expect(res.status).to.equal(200);
                 expect(githubInterface.setPullRequestStatusAsync).to.have.been.called;
                 expect(response.render).to.have.been.calledWithMatch("alert")
             })
            .catch(function(err){
                throw err;
             })
        })
    })

    describe("2. User has not signed CLA since URL for form was generated", function(){
        before("add database data", function(){
            var promises=[]
                promises.push(databaseStore.storeCLARequirementsAsync(testRepoName, testCLAName))
                return Promise.all(promises)
        })

        it("should render the CLA form ", function(){
            return agent.get('/CLA/'+encodeURIComponent(testCLAName)+'/'+encodeURIComponent(testRepoName)+'/'+encodeURIComponent(testPullRequestSha))
            .then(function(res){
                 expect(res.status).to.equal(200);
                 expect(response.render).to.have.been.calledWithMatch("CLA")
             })
            .catch(function(err){
                throw err;
             })
            
        })
    })

    describe("3. User successfully submits form data", function(){
        it("should store form data to database, pull request status updated and then redirect to homepage", function(){
            return agent.post('/CLA/'+encodeURIComponent(testCLAName)+'/'+encodeURIComponent(testRepoName)+'/'+encodeURIComponent(testPullRequestSha))
                .type('form')
                .send({name:"name", email:"test@test.com"})
            .then(function(res){
                expect(res.status).to.equal(200)
                expect(databaseStore.storeSignedCLADetailsAsync).to.have.been.called
                expect(githubInterface.setPullRequestStatusAsync).to.have.been.called
                expect(response.redirect).to.have.been.calledWithMatch('/')
            })
            .catch(function(err){
                throw err;
            })
        })
    })

    describe("4. User submits a form but pull request status can't be updated", function(){
        it("should store form data to database, try to set pull request status and then render an alert", function(){
            return agent.post('/CLA/'+encodeURIComponent(testCLAName)+'/'+encodeURIComponent(testRepoName)+'/'+'123')
                .type('form')
                .send({name:"name", email:"test@test.com"})
            .then(function(res){
                expect(res.status).to.equal(200)
                expect(databaseStore.storeSignedCLADetailsAsync).to.have.been.called
                expect(githubInterface.setPullRequestStatusAsync).to.have.been.called
                expect(response.render).to.have.been.calledWithMatch('alert')
            })
            .catch(function(err){
                throw err;
            })   
        })
    })

    afterEach("remove all spies and close agent", function(){
        databaseStore.resetDatabaseAsync()
        githubInterface.setPullRequestStatusAsync.restore()
        databaseStore.storeSignedCLADetailsAsync.restore()
        response.render.restore()
        response.redirect.restore()
        agent.close() //the server started by agent wont automatically close when tests finish so make sure you close it here
                          //not doing this can lead to bugs
    })
})

