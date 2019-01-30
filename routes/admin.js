// express modules
var express = require('express');
var router = express.Router();

// modules for accessing database and calling github API
var databaseStore = require("../models/DatabaseStore")
var githubinterface = require("../models/GitHubInterface")

const adminFunctions = require("../models/AdminFunctions")


router.get("/", function(req, res, next){
    if(req.user==null){
        res.redirect('/login/github');
        return
    }

    //check if user is admin and if they are store this information in session
    return databaseStore.checkAdminStatusAsync(req.user["id"])
    .then(function(adminStatus){
        admin=adminStatus;
        loggedIn = true;
        profilePicture = req.user["githubPicture"]
        
        res.render('admin', { title: 'Admin', 'loggedIn':loggedIn, 'profilePicture':profilePicture,  'admin':admin});
    })
})


//end point for getting a list of the admin users
router.get("/listOfAdminUsers", function(req,res,next){
    return databaseStore.checkAdminStatusAsync(req.user["id"])
    .then(function(adminStatus){
        if(adminStatus == true){
            return adminFunctions.getAdminUserNamesAsync()
        } else {
            throw "you cannot perform this function if you do not have admin rights"
        }
    })
    .then(function(listOfAdminUsers){
        res.send({adminUsers: listOfAdminUsers})
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})
   
router.post("/deleteAdminUser", function(req,res,next){
    return databaseStore.checkAdminStatusAsync(req.user["id"])
    .then(function(adminStatus){
        if(adminStatus == true){
            return adminFunctions.setAdminStatusAsync(req.body.userName, false)
        } else {
            throw "you cannot perform this function if you do not have admin rights"
        }
    })
    .then(function(response){
       res.status(200).send()
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})

router.post("/addNewAdmin", function(req, res, next){
    return databaseStore.checkAdminStatusAsync(req.user["id"])
    .then(function(adminStatus){
        if(adminStatus == true){
            return adminFunctions.setAdminStatusAsync(req.body.userName, true)
        } else {
            throw "you cannot perform this function if you do not have admin rights"
        }
    })
    .then(function(response){
        if(response == "1"){
            res.status(200).send()
        } else {
            throw "user already has admin rights"
        }
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})

router.post("/whitelistUser", function(req, res, next){
    let repo = req.body["repoName"]
    let userName = req.body["userName"]
    return adminFunctions.whitelistUserAsync(userName,repo)   
         .then(function(response){
            res.status(200).send()
         })
         .catch(function(e){
            res.status(500).send(e)
        })
})

router.post("/whitelist", function(req,res,next){
    let repo = req.body["repoName"]
    return adminFunctions.getWhiteListAsync(repo)
    .then(function(whitelistUsernames){
        res.send({'users':whitelistUsernames})
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})

router.post("/deleteWhitelistedUser", function(req, res,next){
    let repo = req.body["repoName"]
    let userName = req.body["userName"]
    return adminFunctions.removeFromWhitelistAsync(userName, repo)
        .then(function(){
            res.status(200).send()
        })
        .catch(function(e){
           res.status(500).send(e)
        })
})

router.post("/setCLARequirements", function(req, res, next){
    let repo = req.body["repoName"]
    let cla = req.body["claName"]
    return adminFunctions.addCLARequirementAsync(repo, cla)
    .then(function(){
        res.status(200).send()
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})

router.post("/getCLARequirement", function(req, res, next){
    let repo = req.body["repoName"]
    return adminFunctions.retrieveCLARequirementAsync(repo)
    .then(function(claName){
        res.send({'claName':claName})
    })
    .catch(function(e){
        res.status(500).send(e)
    })
})

module.exports = router