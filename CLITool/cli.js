const readline = require('readline');

const interface = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

const databasestore = require('../models/DatabaseStore.js')

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

function setAdminStatus(){
    interface.question("enter githubUserName true or githubusername false to set admin status on user\n",
    (answer)=>{
        let inputs = answer.split(" ");
        if(inputs[1]=="true"){
            databasestore.addAdminUserAsync(inputs[0])
            .then(function(){
                selectOperation()
            })
        } else {
            databasestore.deleteAdminUserAsync(inputs[0])
            .then(function(){
                selectOperation()
            })
        }

        selectOperation()
    })
}

function getAdminUsers(){
    databasestore.getAdminUsers()
        .then(function(adminUsersArray){
            console.log(adminUsersArray)
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

