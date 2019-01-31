# CLA Tracker Node App

## Overview
This app monitors pull requests on github and determines whether an appropriate contributor license agreement (CLA) has been signed. 

If a CLA is required but has not been signed by the contributor the pull request status is set to **failure** and the user will be presented with a link to follow in order to sign up to the CLA. Once the CLA is signed the pull request status will be set to **success**. 

Details of which CLAs a user has signed and the CLA requirements for a particular github project are stored in a Redis database, which must be deployed alongside the clatracker app.

## Requirements
[Node.js](https://nodejs.org/en/)\
[Redis](https://redis.io/download)

## To Install and Run Locally:
make sure you have Node and Redis installed

### Run a Redis Database
```
redis-server
```
a redis server should now be running on port 6379

### Clone clatracker app and install dependencies
```
git clone git@github.com:cla-tracker/clatracker.git
cd clatracker
npm install
```
This will create a folder called **clatrackerapp** containing the app

### Expose the clatracker app 
- Ensure that the clatracker app is externally visible
  - Find out the external IP address of your home network 
  - Go into your router settings and map an external port number to the port and interal IP address of the machine running the
  clatracker app.
  - We will refer to the external url as APP_URL

### Configure the clatracker app 
- The clatracker app requires **2** config files in order to be run locally.

-these files must be located in a folder called **claCONFIG** which is in the same location as the **clatracker** folder created by git clone. So you will now have 2 folders:

../../clatrackerapp
../../claCONFIG

Now create 2 files within **claCONFIG**
#### config_base.txt
export WEBHOOK_SECRET_TOKEN=
export GITHUB_PERSONAL_ACCESS_TOKEN=
export SSL_KEY=
export SSL_CERT=
export CLIENT_ID=
export CLIENT_SECRET=
export SESSION_SECRET=
export GITHUB_RETURN=
export HOSTNAME=

WEBHOOK_SECRET_TOKEN: 
This should be set to a high entropy random string....when you set up a project in Github that you would like to hook up to the clatrackerapp you will use this to secure the payload coming from Github to the clatracker app

GITHUB_PERSONAL_ACCESS_TOKEN:
- Set up a github personal access token to authenticate calls to the github API from clatrackerapp. *You must ensure that the user who creates this personal access token has write access to any repositories you want to hook up to the clatracker app*
  - Select `Settings` from dropdown at top-right of screen
  - Select `Developer Settings`
  - Select `Personal Access Tokens`
  - Select `Generate New Token` and create a token as follows:
    - `Token description`: add any description
    - `Select scopes`: select all options under `repo`
 
 SSL_KEY:
 SSL_CERT:
 - [Create a self signed  SSL Key and Cert for development](https://devcenter.heroku.com/articles/ssl-certificate-self)
 - Expose this key and cert by setting environment variables
   - SSL_KEY = file_path/key.pem
   - SSL_CERT = file_path/cert.pem
   
  CLIENT_ID:
  CLIENT_SECRET:
  GITHUB_RETURN:
  - Create a Github OAUTH App, this is used when user logs into clatracker app in order to get the github profile of that user
  - Select `Settings` from dropdown at top-right of screen
  - Select `Developer Settings`
  - Select `OAUTH apps` and create an OAUTH app as follows:
    - `Application Name`: CLATracker
    - `Homepage URL`: https:localhost:3000
    - `Application Description`: Give your app a description eg.application to manage CLA requirements on opensource projects
    - `Authorisation callback URL`:https://localhost:3000/login/github/return
  - Select `Register Application`
  - Expose your OAUTH app to clatracker app using environment variables
    - CLIENT_ID = OAUTH_CLIENT_ID
    - CLIENT_SECRET = OAUTH_CLIENT_SECRET
    - GITHUB_RETURN = https://localhost:3000/login/github/return
    
SESSION_SECRET:
this should be a randon high entropy string used for securing cookies

HOSTNAME:
https://localhost:3000

##### config_dev
export REDIS_URL=
export CLA_FILES_PATH=

REDIS_URL:
redis://localhost:6379

CLA_FILES_PATH:
- the files for the available CLAs are stored in a folder called CLAFiles
CLAFiles

### Run clatrackerapp:
```npm start_local```
-this will launch the app on https://localhost:3000

## Tests:

### Test Config:
In order to run the test suite on this app you need a third config file

#### config_test
export REDIS_URL=
export GITHUB_PULL_REQ_SHA=
export GITHUB_TEST_REPO_ID=
export GITHUB_TEST_REPO_FULLNAME=
export VERIFICATION_TEST_XHUBSIGNATURE=
export RUN_GITHUBINTERFACE_TESTS=
export RUN_VERIFYSIGNATURE_TESTS=
export CLA_FILES_PATH=
export NODE_ENV=

REDIS_URL:
redis://localhost:6379

GITHUB_TEST_REPO_FULL_NAME:
- Create a test repo on github, or select an existing repo ensuring that you have write access
  - Expose the full name of your test repository as\
 owner\reponame
 
 GITHUB_PULL_REQ_SHA:
 GITHUB_TEST_REPO_ID:
 GITHUB_TEST_REPO_FULLNAME:
 - Set up a webhook from test repository to clatracker to send a payload when a pull-request is created
  - Go intothe test repositories settings and select `Webhooks` and then `add webhook` and setup your webhook as follows:
    - `PayloadURL`: https://APP_URL/githublistener *remember to use externally visible url not localhost
    - `Content Type`: application/json *currently this app only supports application/json webhooks*
    - `Secret`: this is the WEBHOOK_SECRET set up in the config_base file
    - `SSL Verification`: if running app locally for development you can disable ssl verification
    - Select `Let me select individual events` and then tick `Pull requests`
    - Tick `Active`
 - Create a test pull_request from your test repository
 - Go to webhook setup page again and check github made a successful delivery to clatracker app and
  - find ["pull_request"]["head"]["sha"]in the delivered payload
  - set this as GITHUB_PULL_REQ_SHA
  -find ["pull_request"]["repo"]["id"] in the delivered payload
  - set this as GITHUB_TEST_REPO_ID
  
RUN_GITHUBINTERFACE_TESTS:
RUN_VERIFYSIGNATURE_TESTS:
- set these to 1 to run full test suite
- set these to 0 to skip tests that read/write from github and just use a built in test payload

VERIFICATION_TEST_XHUBSIGNATURE:
- When github send clatracker a webhook payload clatracker checks the X-Hub_signature header using the webhook_secret that was stored as an environment variable during installation. However, we skip this step when running test so that we can generate test payloads without having to create the corresponding X-Hub_Signature. There is a seperate test that tests the function that carries out the X-Hub-Signature check. If you wish to run this test there is some additional configuration

```
cd test/data
node generateTestXHubSignature.js
```
set the result as VERIFICATION_TEST_XHUBSIGNATURE


CLA_FILES_PATH:
test/data

NODE_ENV:
'test'
  

### Run Redis Test Database

In a new shell
```
redis-server --port 6380
```
you now have a test database running on port 6380

### Run tests
```npm test```




  

  
 
  
 
  
 













