var config = require("../config.js");

var chai = require("chai");

var expect = require("chai").expect;

var verificationTestPayload = require('./data/verificationTestPayload')
var verificationTestXHubSignature = require('./data/verificationTestXHubSignature')

var verifySignature = require('../helpers/verifySignature');

describe("test that verifySigniture behaves as expected", function(){

  it("should return true if hashed payload equals xHubSignature", function(){
    expect(verifySignature(verificationTestPayload, verificationTestXHubSignature)).to.equal(true);
  })

  it("should return false if hashed payload doesn't equal xHubSignature", function(){
    expect(verifySignature(verificationTestPayload, "")).to.equal(false);
  })

})
