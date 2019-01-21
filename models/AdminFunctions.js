const databasestore = require('./DatabaseStore')
const githubinterface = require('./GitHubInterface')


var AdminFunctions = {
//if user is not already in database add them and then add them to list of admin users
setAdminStatus: function(){
    interface.question("enter githubusername true or githubusername false to set admin status on user\n",
    (answer)=>{
        let inputs = answer.split(" ");
        githubinterface.findUserId(inputs[0])
            .then(function(githubUserId){
                databasestore.checkUserAsync(githubUserId)
                    .then(function(userInDatabase){
                        if(userInDatabase == false){
                            return databasestore.storeUserDetailsAsync(githubUserId,{login:inputs[0]})
                        } else {
                            return "user in database"
                        }
                    })
                    .then(function(){
                        if(inputs[1]=="true"){
                            databasestore.addAdminUserAsync(githubUserId)
                                .then(function(){
                                    selectOperation()
                            })
                        } else {
                            databasestore.deleteAdminUserAsync(githubUserId)
                                .then(function(){
                                    selectOperation()
                                 })
                        }
                    })
            })
    })
},

//get the list of admin users and convert their githubid to their github username
getAdminUsers: function(){
    databasestore.getAdminUsers()
        .then(function(adminUsersArray){

            let promises =[]
            for(let i=0; i<adminUsersArray.length; i++){
                promises.push(databasestore.retrieveUserDetailsAsync(adminUsersArray[i]))
            }

            Promise.all(promises)
                .then(function(arrayOfUsers){
                     console.log(arrayOfUsers)
                     selectOperation()
                })
        })                
},

addCLARequirement: function(){
    interface.question("enter 'full name of github project' 'name of cla' if a cla is already specificied for this project it will be overwritten\n",
    (answer)=>{
        let inputs = answer.split(" ");
        databasestore.storeCLARequirementsAsync(inputs[0], inputs[1])
            .then(function(){
                selectOperation();
            })
    })
},

getCLARequirement: function(){
    interface.question("please enter the full name of the github project\n",
    (answer)=>{
        databasestore.retrieveCLARequirementsAsync(answer)
            .then(function(response){
                console.log(response)
                selectOperation()
            })
    
    })
},

whitelistUser: function(){
    interface.question("please enter 'full github username' 'full github reponame'\n",
    (answer) =>{
        let inputs = answer.split(" ")
        let promises = []
        let userId, repoId
        promises.push(githubinterface.findUserId(inputs[0]))
        promises.push(githubinterface.findRepoId(inputs[1]))
        return Promise.all(promises)
            .then(function(promiseResults){
                userId = promiseResults[0]
                repoId = promiseResults[1]
                return databasestore.checkUserAsync(userId)
            })
            .then(function(response){
                let promises = []
                if(response == true){
                    return databasestore.addUserToWhitelist(userId,repoId)
                } else {
                    promises.push(databasestore.storeUserDetailsAsync(userId, {"id":userId, "login":inputs[0]}))
                    promises.push(databasestore.addUserToWhitelist(userId, repoId))
                    return Promise.all(promises)
                }
            })
            .then(function(){
                selectOperation()
            })
    })
},

removeFromWhitelist: function(){
    interface.question("please enter 'full github username' 'full github reponame'\n",
    (answer) =>{
        let inputs = answer.split(" ")
        let promises = []
        promises.push(githubinterface.findUserId(inputs[0]))
        promises.push(githubinterface.findRepoId(inputs[1]))
        return Promise.all(promises)
            .then(function(results){
                return databasestore.removeUserFromWhitelist(results[0],results[1])
            })
            .then(function(){
                selectOperation()
            })
    })
},

getWhiteList: function(){
    interface.question("please enter 'full github reponame'\n",
    (answer) =>{
        return githubinterface.findRepoId(answer)
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
            for(i=0;i<whitelistUsers.length;i++){
                console.log(whitelistUsers[i].login)
            }
            selectOperation()
        })
    })
},

removesignedCLA: function(){
    interface.question("please enter 'full github username' 'claname'\n",
    (answer) =>{
        let inputs = answer.split(" ")
        return githubinterface.findUserId(inputs[0])
        .then(function(userId){
            return databasestore.deleteSignedCLADetailsAsync(userId, inputs[1])
        })
        .then(function(response){
            selectOperation()
        })
    })
},

getListofCLAs: function(){
    interface.question("please enter 'full github username'\n",
    (answer) =>{
        return githubinterface.findUserId(answer)
        .then(function(userId){
            return databasestore.retrieveUserCLAVersions(userId)
        })
        .then(function(list){
            console.log(list)
            selectOperation()
        })
    })
}

}

module.exports = AdminFunctions