const readline = require('readline');

const interface = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

const databasestore = require('../models/DatabaseStore.js')
const githubinterface = require('../models/GitHubInterface.js')

selectOperation()

    
function selectOperation(){
interface.question(
    "Please select option: \n1. Add Admin User\n2. List Admin Users\n3. Configure CLA requirement for a project\n4. Get CLARequirement for project\n5. Whitelist user\n6.Remove user from whitelist\n7.Get Whitelist\n8. Remove signed CLA\n9.Quit\n",
    (option)=>{
        switch(option){
            case "1":
                setAdminStatus()
                break;
            case "2":
                getAdminUsers()
                break;
            case "3":
                addCLARequirement()
                break;
            case "4":
                getCLARequirement()
                break
            case "5":
                whitelistUser()
                break;
            case "6":
                removeFromWhitelist()
                break;
            case "7":
                getWhiteList()
                break;
            case "8":
                removesignedCLA()
                break;
            case "9":
                interface.close()
                process.exit()
        }        
    }
)
}

//if user is not already in database add them and then add them to list of admin users
function setAdminStatus(){
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
}

//get the list of admin users and convert their githubid to their github username
function getAdminUsers(){
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
}

function addCLARequirement(){
    interface.question("enter 'full name of github project' 'name of cla' if a cla is already specificied for this project it will be overwritten\n",
    (answer)=>{
        let inputs = answer.split(" ");
        databasestore.storeCLARequirementsAsync(inputs[0], inputs[1])
            .then(function(){
                selectOperation();
            })
    })
}

function getCLARequirement(){
    interface.question("please enter the full name of the github project\n",
    (answer)=>{
        databasestore.retrieveCLARequirementsAsync(answer)
            .then(function(response){
                console.log(response)
                selectOperation()
            })
    
    })
}

function whitelistUser(){
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
}

function removeFromWhitelist(){
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
}

function getWhiteList(){
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
}
    
    


