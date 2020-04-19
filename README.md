# discord-devs
repo for discord coding servers current project

goal: create a reusable html/js form that will:
  1. generate a confirmation link
  2. generate a secret pin number and email it to submitter
  3. house the confirmation link and hashed pin within a QR code
  4. confirm user within mongodb when qr is scanned and pin is input
  
 tools:
 nodejs, express, mongodb, w3.css (simple styling)
 
Getting started:
  1. Clone repo (git clone https://github.com/michaeldurocher/discord-devs.git from your termnial/command line)

  2. run 'npm install' for node modules

  3. rename .env.default to .env

  4. create your mongodb
  
    4a. (for linux) run command 'mongo' to enter the mongo shell. type 'use *nameofdb*' in order to create a new db

    4b. (for windows) you may need to launch the mongod and mongo applications in the /bin folder of your mongodb installation also type 'use *nameofdb*' to create the new db

    4c. update .env with your mongo host name (ex. for local db instance - mongodb://localhost/*dbname*)

  5. you will need a mailgun account in order to send confirmation emails

    5a. The domain and api key need to be filled out in the .env file

    5b. Mailgun offers a free sandbox domain account. Very easy to set up

  6. On line 109 of the user.js file, set the 'port' value equal to the localhost machines ip address if you want to access the confirmation page from your phone by scanning the qr code. (must be on the same network) leave as is to access confirmation page from your local machine.

to do:
  1. set up user 'createTransaction' route
  2. Generate secret pin and attach to transaction
  3. list open and closed transactions on user profile page
