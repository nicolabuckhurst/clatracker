# CLA Tracker Node App

## Overview
This app automatically monitors pull requests on github and determines whether an appropriate contributor license agreement (CLA) has been signed. 

If a CLA is required but has not been signed by the contributor the pull request status is set to failure and the user will be presented with a link to follow in order to sign up to the CLA. Once the CLA is signed the pull request status will be set to success. 

Details of which CLAs a user has signed and the CLA requirements for a particular github project are stored in a Redis database, which must be set up alongside the clatracker app.

## Setup




