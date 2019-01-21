const expect = require('chai').expect;

const adminfunctions = require('../models/AdminFunctions')
const databasestore = require('../models/DatabaseStore')

//simple test data..to test reading and writing from database..no need to use full testPayload from github



describe("test admin functions", function(){
    
    afterEach("resets databse", function(){
        return databasestore.resetDatabaseAsync()
    })

    describe("test setting admin status", function(){
        it("adds a new user to database as an admin user, calls back a list of admon users and then deletes admin user", function(){
            return adminfunctions.setAdminStatusAsync('nicolabuckhurst', true)
            .then(function(){
                return databasestore.checkUserAsync('2686508')
            })
            .then(function(inDatabase){
                expect(inDatabase).to.eql(true)
                return databasestore.checkAdminStatusAsync('2686508')
            })
            .then(function(isAdmin){
                expect(isAdmin).to.eql(true)
                return adminfunctions.getAdminUserNamesAsync()
            })
            .then(function(arrayOfAdminUsernames){
                expect(arrayOfAdminUsernames).to.eql(['nicolabuckhurst'])
                return adminfunctions.setAdminStatusAsync('nicolabuckhurst', false)
            })
            .then(function(){
                return databasestore.checkUserAsync('2686508')
            })
            .then(function(inDatabase){
                expect(inDatabase).to.eql(true)
                return adminfunctions.getAdminUserNamesAsync()
            })
            .then(function(arrayOfAdminUsernames){
                expect(arrayOfAdminUsernames).to.eql([])            })

        })
    })

    describe("test whitelisting", function(){
        it("adds a user to whitelist, returns whitelist, deletes user from whitelist", function(){
            return adminfunctions.whitelistUserAsync('nicolabuckhurst', 'cla-tracker/dummydata')
            .then(function(){
                return adminfunctions.getWhiteListAsync('cla-tracker/dummydata')
            })
            .then(function(whitelistUsernames){
                expect(whitelistUsernames).to.eql(['nicolabuckhurst'])
                return adminfunctions.removeFromWhitelistAsync('nicolabuckhurst', 'cla-tracker/dummydata')
            })
            .then(function(){
                return adminfunctions.getWhiteListAsync('cla-tracker/dummydata')
            })
            .then(function(whitelistUsernames){
                expect(whitelistUsernames).to.eql([])
            })
        })
    })

    describe("test removing signed CLA", function(){
        it("returns a list of signed clas for user, deletes a signed cla and returns new list", function(){
            let promises =[]
            promises.push(databasestore.storeUserDetailsAsync('2686508', {id:'2686508', login:'nicolabuckhurst'}))
            promises.push(databasestore.storeSignedCLADetailsAsync('2686508','version1',{email:'testemail'}))
            promises.push(databasestore.storeSignedCLADetailsAsync('2686508', 'version2',{email:"testemail"}))
            return Promise.all(promises)
            .then(function(){
                return adminfunctions.getListofCLAsAsync('nicolabuckhurst')
            })
            .then(function(listOfCLAs){
                expect(listOfCLAs).to.have.members(['version1','version2'])
                return adminfunctions.removeSignedCLAAsync('nicolabuckhurst', 'version1')
            })
            .then(function(){
                return adminfunctions.getListofCLAsAsync('nicolabuckhurst')
            })
            .then(function(listOfCLAs){
                expect(listOfCLAs).to.eql(['version2'])
            })
        })
    })

})