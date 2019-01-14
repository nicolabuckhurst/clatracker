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
    "Please select option: \n1. Add Admin User\n2. List Admin Users\n3. Configure CLA requirement for a project\n4. Get CLARequirement for project\n5. Whitelist user\n6. Remove signed cla for use\n7.Quit\n",
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
                removeSignedCLA()
                break;
            case "7":
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
        githubinterface.findGithubId(inputs[0])
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

