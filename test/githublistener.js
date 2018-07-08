var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = require("chai").expect;

var app = require("../app");

var fs  = require("fs");
var path = require("path")

//do not read in the .json file using requires() ...this checks the syntax for
//the .json file and throws an error when you try and read the corrupt json file
var dummydata = fs.readFileSync(path.join(__dirname, "../dummyPayloads/examplegithubpayload.json"),{encoding:"utf8"})
var dummydataCORRUPT = fs.readFileSync(path.join(__dirname, "../dummyPayloads/examplegithubpayloadCORRUPT.json"),{encoding:"utf8"});

//access extra chaiHttp utilities not as stadard in chai export
chai.use(chaiHttp);

describe("/githublistener POST",function(){

  describe("received a valid github payload", function(){
    it("should respond with a 200", function(){
      return chai.request(app).post('/githublistener')
      .type("application/json")
      .send(dummydata)
      .then(function(res){
        expect(res.status).to.equal(200);
      })
      .catch(function(err){
          throw err;
      })
    })
  })

  //write test for invalid github payload

  describe("pull request opened by org member", function(){
    it("should ignore these pull requests")
  })

  describe("pull request opened by non member", function(){
    it("should check for contributer in database")

    describe("member already signed a cla",function(){


      it("should send a passing status to github")
    })

    describe("member not signed a cla",function(){
      it("should send a failing status to github")
    })
  })
})
