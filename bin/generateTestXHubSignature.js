//run this code from config.txt ...this writes the required signature to terminal
//you can execute this and write the result to the env variable in config.txt
var crypto = require('crypto');

var data = require("../test/data/verifySignatureTestPayload");

//create a HMAC object with the required hash algorithm and the secret to be used
const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET_TOKEN);

//update the hmac object to contain payload data as string, then call digest with 'hex'
//encoding....this is what github uses...see their doc on securing webhooks
var hash = hmac.update(JSON.stringify(data)).digest('hex');

//add sha1= to front of hash as per github docs
var signature = "sha1="+hash;

console.log(signature);
