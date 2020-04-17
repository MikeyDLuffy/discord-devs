# discord-devs
repo for discord coding servers current project

goal: create a reusable html/js form that will: 
  1. generate a confirmation link 
  2. generate a secret pin number and email it to submitter.
  3. house the confirmation link and hashed pin within a QR code.
  4. confirm user within mongodb when qr is scanned and pin is input.
  
 tools:
 nodejs, express, mongodb
 
Getting started:
  1. Clone repo (git clone https://github.com/michaeldurocher/discord-devs.git from your termnial/command line)
  2. run 'npm install' for node modules
  3. rename .env.default to .env
  4. create your mongodb.
    4a. (for linux) run command 'mongo' to enter the mongo shell. type use *nameofdb* in order to create a new db.
    4b. (for windows) you may need to launch the mongod and mongo applications in the /bin folder of your mongodb installation.
    4c. update .env with your mongo host name (ex. for local db instance - mongodb://localhost/*dbname*)
  5. you will need a mailgun account in order to send confirmation emails. 
    5a. The domain and api key need to be filled out in the .env file. 
    5b. Mailgun offers a free sandbox domain account. Very easy to set up. 

to do:
  1. update mongodb when user email account is verified through the confirmation url.
  2. add qr package to generate and save a qr code .png file.
  3. Style flash and error messages on pages

