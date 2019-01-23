const databasestore = require('./DatabaseStore')
const githubinterface = require('./GitHubInterface')


var AdminFunctions = {
//if user is not already in database add them and then add them to list of admin users
setAdminStatusAsync: function(githubUsername, flag){
    let userId
    return githubinterface.findUserId(githubUsername, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
        .then(function(githubUserId){
            userId = githubUserId
            return databasestore.checkUserAsync(githubUserId)
                .then(function(userInDatabase){
                    if(userInDatabase == false){
                        return databasestore.storeUserDetailsAsync(userId, {id:userId,login:githubUsername})
                    } else {
                        return "user in database"
                    }
                })
                .then(function(){
                    if(flag==true){
                        return databasestore.addAdminUserAsync(userId)
                    } else {
                        return databasestore.deleteAdminUserAsync(userId)
                    }
                })
        })
},

//get the list of admin users and convert their githubid to their github username
getAdminUserNamesAsync: function(){
    return databasestore.getAdminUsers()
    .then(function(adminUsersArray){
        let promises =[]
        for(let i=0; i<adminUsersArray.length; i++){
            promises.push(databasestore.retrieveUserDetailsAsync(adminUsersArray[i]))
        }

        return Promise.all(promises)
    })
    .then(function(arrayOfUsers){
        let arrayOfAdminUsernames = [] 
        for(i=0;i<arrayOfUsers.length;i++){
            arrayOfAdminUsernames.push(arrayOfUsers[i].login)
        }
        return arrayOfAdminUsernames
    })                
},

addCLARequirementAsync: function(repoName, claVersion){
    return githubinterface.findRepoId(repoName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(repoId){
        return databasestore.storeCLARequirementsAsync(repoId, claVersion)
    })
},

retrieveCLARequirementAsync: function(repoName){
    return githubinterface.findRepoId(repoName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(repoId){
        return databasestore.retrieveCLARequirementsAsync(repoId)
    })    
},

whitelistUserAsync: function(githubUsername, repoName){
    let userId, repoId
    let promises = []
    promises.push(githubinterface.findUserId(githubUsername, process.env.GITHUB_PERSONAL_ACCESS_TOKEN))
    promises.push(githubinterface.findRepoId(repoName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN))
    return Promise.all(promises)
    .then(function(promiseResults){
        userId = promiseResults[0]
        repoId = promiseResults[1]
        return databasestore.checkUserAsync(userId)
            .then(function(response){
                let promises = []
                if(response == true){
                    return databasestore.addUserToWhitelist(userId,repoId)
                } else {
                    promises.push(databasestore.storeUserDetailsAsync(userId, {"id":userId, "login":githubUsername}))
                    promises.push(databasestore.addUserToWhitelist(userId, repoId))
                    return Promise.all(promises)
                }
            })
    })       
},

removeFromWhitelistAsync: function(githubName, repoName){
    let promises = []
    promises.push(githubinterface.findUserId(githubName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN))
    promises.push(githubinterface.findRepoId(repoName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN))
    return Promise.all(promises)
    .then(function(results){
        return databasestore.removeUserFromWhitelist(results[0],results[1])
    })
},

getWhiteListAsync: function(repoName){
    return githubinterface.findRepoId(repoName, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(repoId){
        return databasestore.getWhitelist(repoId)
    })
    .then(function(whitelist){
        let promises = []
        for(i=0; i<whitelist.length; i++){
            promises.push(databasestore.retrieveUserDetailsAsync(whitelist[i]))
        }
        return Promise.all(promises)
    })
    .then(function(whitelistUsers){
        let whitelistUsernames=[]
        for(i=0;i<whitelistUsers.length;i++){
            whitelistUsernames.push(whitelistUsers[i].login)
        }
        return whitelistUsernames
    })
},

removeSignedCLAAsync: function(githubUsername, claVersion){
    return githubinterface.findUserId(githubUsername, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(userId){
        return databasestore.deleteSignedCLADetailsAsync(userId, claVersion)
    })
},

getListofCLAsAsync: function(githubUsername){
    return githubinterface.findUserId(githubUsername, process.env.GITHUB_PERSONAL_ACCESS_TOKEN)
    .then(function(userId){
        return databasestore.retrieveUserCLAVersions(userId)
    })
}

}

module.exports = AdminFunctions