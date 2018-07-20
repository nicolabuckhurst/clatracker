var crypto = require('crypto');

/****** THIS FUNCTION ONLY WORKS WITH APPLICATION/JSON webhooks currently*******/
var verifySignature = function(payloadBody, xHubSignature){

  //create a HMAC object with the required hash algorithm and the secret to be used
  const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET_TOKEN);

  //update the hmac object to contain payload data as string, then call digest with 'hex'
  //encoding....this is what github uses...see their doc on securing webhooks
  var hash = hmac.update(JSON.stringify(payloadBody)).digest('hex');

  //add sha1= to front of hash as per github docs
  var signature = "sha1="+hash;

  //use a timing safe equal function rather than == as its more secure as all
  //comparisons will take same time...the function in crypto can only compare
  //Buffers so convert the 2 strings to compare to buffers
  try{
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(xHubSignature))
  }
  catch(e) {
    return false;
  }
}

module.exports = verifySignature;
