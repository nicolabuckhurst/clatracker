// express modules
var express = require('express');
var router = express.Router();

// modules for accessing database and calling github API
var databaseStore = require("../models/DatabaseStore")
var gitHubInterface = require("../models/GitHubInterface")

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
    console.log("called")
    return databaseStore.checkAdminStatusAsync(req.user["id"])
    .then(function(adminStatus){
        if(adminStatus == true){
            return adminFunctions.setAdminStatusAsync(req.body.userName, true)
        } else {
            throw "you cannot perform this function if you do not have admin rights"
        }
    })
    .then(function(response){
        console.log(response)
        if(response == "1"){
            res.status(200).send()
        } else {
            throw "user already has admin rights"
        }
    })
    .catch(function(e){
        console.log("throwing error" + e)
        res.status(500).send(e)
    })
})

module.exports = router