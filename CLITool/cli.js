const readline = require('readline');

const interface = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

const adminfunctions = require('../models/AdminFunctions')
const databasestore = require('../models/DatabaseStore')


/****THERE ARE NO AUTOMATED TESTS FOR THIS FILE -- TESTED MANUALLY */

selectOperation()

    
function selectOperation(){
interface.question(
    "Please select option: \n1. Add Admin User\n2. List Admin Users\n3. Configure CLA requirement for a project\n4. Get CLARequirement for project\n5. Whitelist user\n6. Remove user from whitelist\n7. Get Whitelist\n8. Remove signed CLA\n9. Get List of CLAs for User\n10. Quit\n",
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
                getWhitelist()
                break;
            case "8":
                removesignedCLA()
                break;
            case "9":
                getListofCLAs()
                break;
            case "10":
                interface.close()
                process.exit()
            default:
                console.log("invalid option")
                selectOperation()
        }        
    }
)
}

function setAdminStatus(){
    interface.question("enter githubusername true or githubusername false to set admin status on user\n",
    (answer)=>{
        let inputs = answer.split(" ")
        return adminfunctions.setAdminStatusAsync(inputs[0], JSON.parse(inputs[1]))
            .then(function(){
                selectOperation()
            })
    })
}

function getAdminUsers(){
    adminfunctions.getAdminUserNamesAsync()
        .then(function(arrayOfAdminUsernames){
            for(i=0; i<arrayOfAdminUsernames.length;i++){
                console.log(arrayOfAdminUsernames[i]+" ")
            }
            selectOperation()
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
         return adminfunctions.whitelistUserAsync(inputs[0], inputs[1])   
         .then(function(response){
            selectOperation()
         })
    })
}

function removeFromWhitelist(){
    interface.question("please enter 'full github username' 'full github reponame'\n",
    (answer) =>{
        let inputs = answer.split(" ")
        return adminfunctions.removeFromWhitelistAsync(inputs[0], inputs[1])
        .then(function(){
            selectOperation()
        })
    })
}

function getWhitelist(){
    interface.question("please enter 'full github reponame'\n",
    (answer) =>{
        return adminfunctions.getWhiteListAsync(answer)
        .then(function(whitelistUsernames){
            for(i=0;i<whitelistUsernames.length;i++){
                console.log(whitelistUsernames[i]+" ")
            }
            selectOperation()
        })
    })
}

function removesignedCLA(){
    interface.question("please enter 'full github username' 'claname'\n",
    (answer) =>{
        let inputs = answer.split(" ")
        return adminfunctions.removesignedCLAAsync(inputs[0],inputs[1])
        .then(function(){
            selectOperation()
        })
    })
}

function getListofCLAs(){
    interface.question("please enter 'full github username'\n",
    (answer) =>{
        return adminfunctions.getListofCLAsAsync(answer)
        .then(function(listOfCLAs){
            for(i=0;i<listOfCLAs.length;i++){
                console.log(listOfCLAs[i])
            }
            selectOperation()
        })
    })
}
