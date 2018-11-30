/* require redis module*/
var redis = require('redis');

/*require bluebird to use bluebird promises and promisify the redisClient object*/
var bluebird = require('bluebird');

/*promisify the redis client object methods...adds Async to end of method name*/
bluebird.promisifyAll(redis);

//Data is stored in database as follows:
//a users github profile details are stored by key user:githubId
//a list of clas signed by a user are stored in a Set by key CLAList:githubId ..sets don't allow repeated members...so if a CLA is signed more than once it will only appear once in set
//CLARequirements are stored against a key CLARequirements as a hash repositoryname:cla version
//User details for a particular CLA  are stored against a key CLA:claversion:githubId (these could be different to github profile info)
//The CLA content is stored as hash against key CLA:claversion
//.......The page that displays the CLA expects the content to have a name, some text which can be
//be found in the named mark down file and a list of required and optional field for the user
//to fill in and the type of form field that should be rendered eg:
//  {
//  "name":"Apache 2.0",
//  "text":"Apachev2.0.md",
//  "optional fields": {
//  "organisation name":"text",
//  "title":""
//  },
//  "required fields":{
//    "full name":"textarea",
//    "date":"date",
//    "email":"email",
//    "address":"textarea"
//  }
//  }


var DatabaseStore = {

  //creates a client for interacting with correct databse
  connectToDatabase: function(){
    return redis.createClient(process.env.REDIS_URL)
  },


  //takes object containing user details as field:value pairs eg {"username":"testuser"}
  //stores these details against key "user:githubId" in a Hash datastructure in Redis database
  storeUserDetailsAsync: function(githubId, details){
    let client=this.connectToDatabase(); //create a client to interact with database
    let key = "user:"+githubId;          //create key for user details

    return client.hmsetAsync(key,details) //return a promise to store user details in Redis
      .then(function(redisresponse){
        client.quit()                     //close connection to database
        return redisresponse             //finally return the response from Redis database..this should be string "OK"
      })
  },

  //takes githubId as argument
  //returns user details from database as an object containing field:value pairs  eg {"username":"testuser"}
  retrieveUserDetailsAsync: function(githubId){
    let client=this.connectToDatabase(); //create a client to interact with database
    let key = "user:"+githubId;          //create a key for accessing user details

    return client.existsAsync(key) //check if user key exists in database
      .then(function(exists){
        if(exists==1){
          return client.hgetallAsync(key) //if user exists return a promise to get user details from database
        } else {
          return null //if user doesn't exist return a fullfilled promise with value null
        }
      })
      .then(function(userDetailsFromDatabase){
        client.quit()                   //close connection to database
        return userDetailsFromDatabase //return the object that is returned from database or null is user not found
      })
  },

  //takes githubId as an argument
  //checks if user details exists in database...simply converts redis 1,0 response to more logical true or false
  checkUserAsync: function(githubId){
    let client=this.connectToDatabase(); //connect to database
    let key = "user:"+githubId; //create a key for accessing user details

    return client.existsAsync(key) //return a promise to find key in database
      .then(function(redisResponse){
        client.quit();     //close connection to datatbase
        if(redisResponse == 1){ //convert 1, 0 redis response to true or false
          return true;
        } else {
          return false
        }
      })
  },

  //add githubId to list of admin Users
  addAdminUser: function(githubId){
    let client=this.connectToDatabase(); //connect to database
    let key = "adminUsers"; // key for storing list of admin users against

    return client.saddAsync(key,githubId)
      .then(function(response){
        client.quit();
        return response; //integer 1 if successfully added 0 if githubID is already present and so not added again
      })
  },

  //remove githubId from the list of admin users
  deleteAdminUser: function(githubId){
    let client=this.connectToDatabase(); //connect to database
    let key = "adminUsers"; //key of admin users

    return client.sremAsync(key, githubId)
      .then(function(response){
        client.quit();
        return response; //integer 1 is githubID is removed, 0 if nothing is removed as githubId isnt in set
      })
  },

  //check if a user has admin status
  checkAdminStatus: function(githubId){
    let client=this.connectToDatabase(); //connect to database
    let key = "adminUsers"; //key of list of admin users

    return client.sismemberAsync(key, githubId) //returns a 1 if user is admin user or 0 if not
      .then(function(response){
        client.quit();
        return !!response; //!! operator turns integar into boolean
      })
  },

  //save details when a CLA is signed including:
  // -- adding the CLA name to the list of CLAs stored against a user
  // -- storing the details of the signed CLA as a seperate entry in database
  storeSignedCLADetailsAsync: function(githubId, CLAVersion, CLAUserDetails){
    let client=this.connectToDatabase(); //connect to database

    let CLAListKey = "CLAList:"+githubId; //key to access set of CLAs signed by user
    let CLAVersionNoSpaces = CLAVersion.replace(" ","")
    let CLADetailsKey="CLA:"+CLAVersionNoSpaces+":"+githubId; //key to store user details for this CLA

    let promises =[];

    promises.push(client.saddAsync(CLAListKey, CLAVersion));  //if key doesn't exist in database it will be created
    promises.push(client.hmsetAsync(CLADetailsKey, CLAUserDetails)); //if key exists data will be overwritten

    return Promise.all(promises)
      .then(function(redisResponses){ //the redis response for saddAsync is the number of members stored (member isn't stored if it already exists)
                                       //for the hmsetAsync response should be "OK"
        client.quit() //close connection to data
        return redisResponses; //will be [1, "OK"] if successful
      })
  },

  //get the user details entered against a particular CLA (these may be diff to the users profile details)
  retrieveSignedCLADetailsAsync: function(githubId, CLAVersion){
    let client = this.connectToDatabase(); //connect to database

    let claVersionNoSpaces = CLAVersion.replace(" ","")
    let key = "CLA:"+claVersionNoSpaces+":"+githubId; //key for retrieving user details for this CLA

    return client.hgetallAsync(key)
      .then(function(CLADetails){
        client.quit() //close connection to database
        return CLADetails //return user details for CLA as an object
      })
  },

  //retrieve list of users CLA versions
  retrieveUserCLAVersions: function(githubId){
      let client=this.connectToDatabase(); //connect to database

      let key = "CLAList:"+githubId; //key to access set of CLAs signed by user

      return client.smembersAsync(key) //returns an array of CLA Versions.....cannot guarantee order returned in
        .then(function(CLAList){
          client.quit() //close connection to database
          return(CLAList)
        })
  },

  //check if a CLA has been signed by user
  checkCLASignedAsync: function(githubId, CLAVersion){
    let client=this.connectToDatabase(); //connect to database

    let key = "CLAList:"+githubId; //key to access set of CLAs signed by user

    return client.sismemberAsync(key, CLAVersion) //returns a 1 if true and 0 if false
      .then(function(redisResponse){
        client.quit(); //close connection to database
        if(redisResponse == 1){ //converts redis 1, 0 response to true, false
          return true;
        } else {
          return false;
        }
      })
  },

  //set the CLA Version required for a repository
  storeCLARequirementsAsync: function(repositoryFullName, CLAVersion){
    let client=this.connectToDatabase(); //connect to database

    return client.hsetAsync("CLARequirements", repositoryFullName, CLAVersion)
      .then(function(redisResponse){
        client.quit() //close connection to database
        return redisResponse
      })
  },

  //check which CLA version is required for a repository
  retrieveCLARequirementsAsync: function(repositoryFullName){
    let client=this.connectToDatabase(); //connect to database

    return client.hgetAsync("CLARequirements", repositoryFullName)
      .then(function(CLAVersion){
        client.quit() //close connection to database
        return CLAVersion
      })
  },

  //get a list of CLAReequirements
  retrieveCLARequirementListAsync: function(){
    let client=this.connectToDatabase(); //connect to database

    return client.hgetallAsync("CLARequirements") //returns an object with repositoryFullName: CLAVersion pairs
      .then(function(list){
        client.quit();
        return(list)
      })
  },

  //retrieve CLA content from database -- CURRENTLY NOT IN USE, cla details stored in a .json and .md file not in database
  retrieveCLAContentAsync: function(claVersion){
    let client = this.connectToDatabase(); //connect to database
    let key = "CLA:"+claVersion+":"; //create a key to store the CLA contents against CLA:CLAVersion

    return client.hgetallAsync(key) //returns an object of key:value pairs describing content of CLA to be displayed
      .then(function(CLAContent){
        client.quit() //close connection to database
        return(CLAContent)
      })
  },

  //store the CLAContent in database -- CURRENTL NOT IN USE, cla details stored in a .json and .md file not in database
  //takes an object as argument with key:value pairs describing content
  storeCLAContentAsync: function(claContent){
    let client = this.connectToDatabase(); //connect to database
    let key = "CLA:"+claContent["name"]+":"; //create a key to store the CLA content against

    return client.hmsetAsync(key, claContent)
      .then(function(redisResponse){ //responds with OK is successfully set
        client.quit() //close connection to database
        return(redisResponse)
      })
  },

  //reset database .. used in tests to rest database between tests
  resetDatabaseAsync: function(){
    let client=this.connectToDatabase(); //connect to database

    return client.flushallAsync()
      .then(function(redisResponse){
        client.quit();
        return(redisResponse)
      })
  }

}



module.exports = DatabaseStore;
