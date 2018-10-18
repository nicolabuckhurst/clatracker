/**
 * Module dependencies.
 */

var databaseStore = require("../models/DatabaseStore.js");
var githubInterface = require("../models/GitHubInterface.js")

//process.argv is an array of the arguments passed into the function when it is called on commandline
//eg $node ./bin/admin nicolabuckhurst true the first element of the array is always  process.execPath.
//and the second is the pathname to the javascriupt file being executed
//so argv[2] and argv[3] would access the 2 arguments passed in from command line
console.log(process.argv[2], process.argv[3])

githubInterface.findGithubId(process.argv[2])
  .then(function(githubId){
    databaseStore.addAdminUser(githubId)
  })
