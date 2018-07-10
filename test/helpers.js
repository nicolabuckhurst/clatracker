var config = require("../config.js");

var chai = require("chai");

var expect = require("chai").expect;

var testPayload = require('./data/testPayload')
var testXHubSignature = require('./data/testXHubSignature')

var verifySignature = require('../helpers/verifySignature');

describe("test that verifySigniture behaves as expected", function(){

  console.log(testPayload);
  console.log(testXHubSignature);

  it("should return true if hashed payload equals xHubSignature", function(){
    expect(verifySignature(testPayload, testXHubSignature)).to.equal(true);
  })

  it("should return false if hashed payload doesn't equal xHubSignature", function(){
    expect(verifySignature(testPayload, "")).to.equal(false);
  })

})
