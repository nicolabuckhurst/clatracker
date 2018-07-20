/* require redis module*/
var redis = require('redis');

/*require bluebird to use bluebird promises and promisify the redisClient object*/
var bluebird = require('bluebird');

/*promisify the redis client object methods...adds Async to end of method name*/
bluebird.promisifyAll(redis);

var DatabaseStore = {

  //add a method that creates a client for interacting with correct databse
  connectToDatabase: function(){
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

      return client.existsAsync(key)
        .then(function(exists){
          if(exists==1){
            return client.hgetallAsync(key)
          } else {
            return null
          }
        })
        //return a promise to get user details from Redis
        .then(function(userDetailsFromDatabase){
          client.quit()                   //close connection to database
          return(userDetailsFromDatabase) //return the object that is returned from database
                                          //or null is user not found
        })
    },

    //check if user exists
    checkUserAsync: function(githubId){
      let client=this.connectToDatabase(); //connect to database
      let key = "user:"+githubId; //create a key for accessing user details

      return client.existsAsync(key) //return a promise to find key in database
        .then(function(redisResponse){
          client.quit()     //close connectoin to datatbase
          if(redisResponse == 1){ //convert 1, 0 redis response to true or false
            return(true);
          } else {
            return(false)
          }
        })
    },

    //add a CLA Version to user
    addCLAVersionAsync: function(githubId, version, CLAUserDetails){
      let client=this.connectToDatabase(); //connect to database

      let CLAListKey = "CLAList:"+githubId;
      let CLADetailsKey="CLA:"+version+":"+githubId;

      let promises =[];

      promises.push(client.saddAsync(CLAListKey, version));  //if key doesn't exist in database it will be created
      promises.push(client.hmsetAsync(CLADetailsKey, CLAUserDetails));

      return Promise.all(promises)
        .then(function(redisResponses){ //the redis response for saddAsync is the number of members stored
                                       //(member isn't stored if it already exists)
                                       //for the hmsetAsync response should be "OK"
          console.log(redisResponses);
          client.quit() //close connection to data
          return(redisResponses)
        })
    },

    //retrieve list of users CLA versions
    getCLAVersionsAsync: function(githubId){
        let client=this.connectToDatabase(); //connect to database
        let key = "CLAList:"+githubId;

        return client.smembersAsync(key) //returns an array of CLA Versions
          .then(function(CLAList){
            client.quit() //close connection to database
            return(CLAList)
          })
    },

    //get CLA version details
    getCLADetailsAsync: function(githubId, version){
      let client = this.connectToDatabase(); //connect to database
      let key = "CLA:"+version+":"+githubId;

      return client.hgetallAsync(key)
        .then(function(CLADetails){
          client.quit() //close connection to database
          return(CLADetails)
        })
    },

    //check if a CLA has been signed by user
    checkCLAAsync: function(githubId, version){
      let client=this.connectToDatabase(); //connect to database
      let key = "CLAList:"+githubId;

      console.log("key"+key);
      console.log("look up version"+version)

      return client.sismemberAsync(key, version) //returns a 1 if true and 0 if false
        .then(function(redisResponse){
          console.log("sismember result"+redisResponse)
          client.quit(); //close connection to database
          if(redisResponse == 1){
            return true;
          } else {
            return false;
          }
        })
    },

    //reset database
    resetDatabaseAsync: function(){
      let client=this.connectToDatabase(); //connect to database
      return client.flushallAsync()
        .then(function(redisResponse){
          client.quit();
          return(redisResponse)
        })
    },

    //set the CLA Version required for a repository
    setCLARequirementsAsync: function(repositoryFullName, version){
      let client=this.connectToDatabase(); //connect to database
      return client.hsetAsync("CLARequirements", repositoryFullName, version)
        .then(function(redisResponse){
          client.quit() //close connection to database
          return redisResponse
        })
    },

    //check which CLA version is required for a repository
    checkCLARequirementsAsync: function(repositoryFullName){
      console.log(repositoryFullName)
      let client=this.connectToDatabase(); //connect to database
        return client.hgetAsync("CLARequirements", repositoryFullName)
          .then(function(CLAVersion){
            client.quit() //close connection to database
            console.log(CLAVersion)
            return CLAVersion
          })
    },

    //get a list of CLAReequirements
    getCLARequirementListAsync: function(){
      let client=this.connectToDatabase(); //connect to database
        return client.hgetallAsync("CLARequirements") //returns an object with of the key:name pairs
          .then(function(list){
            client.quit();
            return(list)
          })
    },

}



module.exports = DatabaseStore;
