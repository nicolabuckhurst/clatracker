const readline = require('readline');

const interface = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

const databasestore = require('../models/DatabaseStore.js')

selectOperation()

    
function selectOperation(){
interface.question(
    "Please select option: \n1. Add Admin User\n2. Configure CLA requirement for a project\n3. Whitelist user\n4. Remove signed cla for use\n5.Quit\n",
    (option)=>{
        switch(option){
            case "1":
                setAdminStatus()
                break;
            case "2":
                addCLARequirement()
                break;
            case "3":
                whitelistUser()
                break;
            case "4":
                removeSignedCLA()
                break;
            case "5":
                process.exit()
        }        
    }
)
}

function setAdminStatus(){
    interface.question("enter githubUserName true or githubusername false to set admin status on user\n",
    (answer)=>{
        inputs = answer.split(" ");
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


