const readline = require('readline');

const interface = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

const adminfunctions = require('../models/AdminFunctions')

selectOperation()

    
function selectOperation(){
interface.question(
    "Please select option: \n1. Add Admin User\n2. List Admin Users\n3. Configure CLA requirement for a project\n4. Get CLARequirement for project\n5. Whitelist user\n6. Remove user from whitelist\n7. Get Whitelist\n8. Remove signed CLA\n9. Get List of CLAs for User\n10. Quit\n",
    (option)=>{
        switch(option){
            case "1":
                adminfunctions.setAdminStatus()
                break;
            case "2":
                adminfunctions.getAdminUsers()
                break;
            case "3":
                adminfunctions.addCLARequirement()
                break;
            case "4":
                adminfunctions.getCLARequirement()
                break
            case "5":
                adminfunctions.whitelistUser()
                break;
            case "6":
                adminfunctions.removeFromWhitelist()
                break;
            case "7":
                adminfunctions.getWhiteList()
                break;
            case "8":
                adminfunctions.removesignedCLA()
                break;
            case "9":
                adminfunctions.getListofCLAs()
                break;
            case "10":
                interface.close()
                process.exit()
        }        
    }
)
}

