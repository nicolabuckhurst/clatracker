var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = require("chai").expect;

var app = require("../app");

//access extra chaiHttp utilities not as stadard in chai export
chai.use(chaiHttp);

describe("/status any HTTP requests", function(){
  it("should respond with a 200", function(){
    //request / with a GET method...VERY IMPORTANT to return the promise to the
    //enclosing describe function...otherwise no tests will actually execute
    //and this test will be always green!!
    return chai.request(app).get('/status')
      //we are using promises version of chai so this will return a Promise
      .then(function(res){
        expect(res.status).to.equal(200);
      })
      //If promise is rejected or the success callback function throws an error,
      //catch the error and throw it
      //...if you use a catch block here it is important to throw the error
      //or it won't this won't be caught by describe and the test will appear to pass
      .catch(function(err){
        throw err
      })
  })
})
