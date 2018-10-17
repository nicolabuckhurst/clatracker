# CLA Tracker Node App

## Overview
This app automatically monitors pull requests on github and determines whether an appropriate contributor license agreement (CLA) has been signed. 

If a CLA is required but has not been signed by the contributor the pull request status is set to failure and the user will be presented with a link to follow in order to sign up to the CLA. Once the CLA is signed the pull request status will be set to success. 

Details of which CLAs a user has signed and the CLA requirements for a particular github project are stored in a Redis database, which must be set up alongside the clatracker app.

## Requirements
[Node.js](https://nodejs.org/en/)\
[Redis](https://redis.io/download)

## Install
make sure you have Node and Redis installed

#### Run a Redis Database
```
redis-server
```
a redis server should now be running on port 6379

#### Install clatracker app
In a new shell
```
git clone git@github.com:cla-tracker/clatracker.git
cd clatracker
npm install
```

#### Configure clatracker app (in the shell where you installed the clatracker app)
- Ensure that the clatracker app is externally visible
  - Find out the external IP address of your home network 
  - Go into your router settings and map an external port number to the port and interal IP address of the machine running the
  clatracker app.
  - We will refer to the external url as APP_URL

- Expose your Redis server by setting an environment variable\
```export REDIS_DEV_URL="redis://localhost:6379"```

- Set up a github personal access token to authenticate calls to the github API when clatracker app updates pull-request statuses to inform the github user if they need to sign a CLA. You must ensure that user who creates this personal access token has write access to any repositories you want to hook up to the clatracker app
  - Select `Settings` from dropdown at top-right of screen
  - Select `Developer Settings`
  - Select `Personal Access Tokens`
  - Select `Generate New Token` and create a token as follows:
    - `Token description`: add any description
    - `Select scopes`: select all options under `repo`
  - Expose the github personal access token to the clatracker app using environment variable\
  ```export GITHUB_PERSONAL_ACCESS_TOKEN="PERSONAL ACCESS TOKEN"```

- Create a Github OAUTH App, this is used when user logs into clatracker app in order to get the github profile of that user
  - Select `Settings` from dropdown at top-right of screen
  - Select `Developer Settings`
  - Select `OAUTH apps` and create an OAUTH app as follows:
    - `Application Name`: CLATracker
    - `Homepage URL`: https:localhost:3000
    - `Application Description`: Give your app a description eg.application to manage CLA requirements on opensource projects
    - `Authorisation callback URL`:https://localhost:3000/login/github/return
  - Select `Register Application`
  - Expose your OAUTH app to clatracker app using environment variables\
  `export CLIENT_ID="OAUTH_CLIENT_ID"`\
  `export CLIENT_SECRET="OAUTH_CLIENT_SECRET"`\
  `export GITHUB_RETURN=https://localhost:3000/login/github/return`
  
- [Create a self signed  SSL Key and Cert for development](https://devcenter.heroku.com/articles/ssl-certificate-self)
  - Expose this key and cert by setting environment variables\
  `export SSL_KEY='file_path/key.pem`\
  `export SSL_CERT='file_path/cert.pem`

## Tests

#### Run Redis Test Database

In a new shell
```
redis-server --port 6380
```
you now have a test database running on port 6380

#### Configure Core Tests
- Go to the shell where clatracker is running and quit\
`^C`

- Expose your Redis server by setting an environment variable\
`export REDIS_DEV_URL="redis://localhost:6379"`

- Create a test repo on github, or select an existing repo ensuring that you have write access
  - Expose the full name of your test repository as\
  `export GITHUB_TEST_REPO_FULL_NAME ="owner\reponame"`

- Set up a webhook from test repository to clatracker to send a payload when a pull-request is created
  - Go intothe test repositories settings and select `Webhooks` and then `add webhook` and setup your webhook as follows:
    - `PayloadURL`: https://APP_URL/githublistener
    - `Content Type`: application/json *currently this app only supports application/json webhooks*
    - `Secret`:type a random string with high entropy we will refer to this as WEBHOOK_SECRET
    - `SSL Verification`: if running app locally for development you can disable ssl verification
    - Select `Let me select individual events` and then tick `Pull requests`
    - Tick `Active`
  - Expose your webhook secret to the clatracker app using an environment variable\
  `export WEBHOOK_SECRET_TOKEN="WEBHOOK_SECRET"`

- Create a test pull_request from your test repository

- Go to webhook setup page again and check github made a successful delivery to clatracker app and
  - find ["pull_request"]["head"]["sha"]in the delivered payload
  - store this sha as env variable\
  `export GITHUB_PULL_REQ_SHA ="TEST_PULL_REQUEST_SHA"` *this will only be used for tests
  
 - If you only want to test that clatracker performs correctly when receiving a valid/invalid webhook payload you can set
 the following environment variables\
 `export RUN_GITHUBINTERFACE_TESTS=0`\
 `export RUN_VERIFYSIGNATURE_TESTS=0`

#### Configure Optional Tests
- If you want to test that clatracker can interface with github remotely set the pull_request status on the test pull request set\
`export RUN_GITHUBINTERFACE_TESTS=1`

- When github send clatracker a webhook payload clatracker checks the X-Hub_signature header using the webhook_secret that was stored as an environment variable during installation. However, we skip this step when running test so that we can generate test payloads without having to create the corresponding X-Hub_Signature. There is a seperate test that tests the function that carries out the X-Hub-Signature check. If you wish to run this test there is some additional configuration

```
cd test/data
node generateTestXHubSignature.js
```
- take the result and store as an environment variable\
`export VERIFICATION_TEST_XHUBSIGNATURE="RESULT"`
`cd ../..`

#### Run clatracker app
```
npm start
```
you should now have clatracker running on https://localhost:3000

  
  

  

  
 
  
 
  
 













