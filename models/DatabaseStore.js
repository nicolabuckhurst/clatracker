/* require redis module*/
var redis = require('redis');

/*require bluebird to use bluebird promises and promisify the redisClient object*/
var bluebird = require('bluebird');

/*promisify the redis client object methods...adds Async to end of method name*/
bluebird.promisifyAll(redis);

var DatabaseStore = {

  //add a method that creates a client for interacting with correct databse
  connectToDatabase: function(){
    console.log("this is the "+process.env.NODE_ENV+"environment");
    console.log("connected to database at "+process.env.REDIS_URL)
    return redis.createClient(process.env.REDIS_URL)
  },


  //store a new contributers details in a Hash datastructure in Redis database
  storeContributorDetailsAsync: function(githubId, details){

    let client=this.connectToDatabase(); //connect to database
    let key = "user:"+githubId;          //create key for user details Hash

    return client.hmsetAsync(key,details) //return a promise to store user details in Redis
      .then(function(redisresponse){
        client.quit()                     //close connection to database
        return(redisresponse)             //finally return the response from Redis database
      })
    },

    //retrieve user details from Redis
    retrieveContributorDetailsAsync: function(githubId){

      let client=this.connectToDatabase(); //connect to database
      let key = "user:"+githubId;          //create a key for accessing user details

      return client.hgetallAsync(key)      //return a promise to get user details from Redis
        .then(function(userDetailsFromDatabase){
          client.quit()                   //close connection to database
          return(userDetailsFromDatabase) //return the object that is returned from database
        })


    }

}



module.exports = DatabaseStore;
