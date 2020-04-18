require('dotenv').config();
var express = require('express');
var router = express.Router();
var path = require('path');
var expressValidator = require('express-validator');
var { check, body, oneOf, validationResult, isEmail }  = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var QRCode = require('qrcode');
const mailGun = require('nodemailer-mailgun-transport');
var { User, Token } = require('../models/User');

//conect to the mongo database
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex:true});
var db = mongoose.connection;

//set up mailing variable
const mailAuth = {
	auth: {
		api_key:  process.env.MAILGUNAPI,
		domain:  process.env.MAILGUNDOMAIN,
	}
};

const mailTransporter = nodemailer.createTransport(mailGun(mailAuth));


//email confirmation
router.get('/confirmationPage', function(req,res){
	res.render('confirmationPage');
})


//post registration
router.post('/register', [
	//initial checks using express validator
	check('email','Email is required').not().isEmpty(),
	check('email', 'Please use a valid email address').isEmail(),
	check('passw','Password is required').not().isEmpty(),
	check('passwconfirm','username is required').not().isEmpty(),
	check('passw', 'Password field is required').isLength({min: 8, max: 35}).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')
    .withMessage('Password must include one lowercase character, one uppercase character, a number, and a special character.').custom((value,{req, loc, path}) => {
		if (value !== req.body.passwconfirm) {
			throw new Error("Passwords do not match");
		} 
		else {
			return value;
		}
	}),
], function(req,res) {
	//get form values
	email = req.body.email;
	password = req.body.passw;
	passwordconfirm = req.body.passwconfirm;
	
	//check for any errors from the express validator checks
	const result = validationResult(req);
	var errors = result.errors;

	if(!result.isEmpty()) {
		//if there are errors render the register page again and show the errors
		res.render('login', {
			errors:errors,
			email:email,
			password:password,
			passworconfirm:passwordconfirm,
		});
	}
	else{
		//if no errors we are going to create the user
		var newUser = new User ({
			email:email,
			password:password,
		});

		//encrypt the password for storage 
		bcrypt.genSalt(15, function(err, salt){
			bcrypt.hash(newUser.password, salt, function(err, hash){
				newUser.password = hash;

				//confirm no one else is using the email alreadt
				User.findOne({email:newUser.email}, function(err,user){
					if(!user) {
						newUser.save(function(err,user){
							if (err){
								res.send(err);
							}
							else {
								//create a new verification token
								var token = new Token({
								_userId: newUser._id, token: crypto.randomBytes(16).toString('hex')
								});

								//save the verification token this will get input into QR code
								token.save(function(err){
									if(err){
										return res.status(500).send({msg:err.message});
									}
									console.log('User Added');
									
									//CHANGE PORT VALUE TO YOUR LOCAL HOSTS IP AND PORT NUMBER IN ORDER TO ACCESS QR CONFIRMATION PAGE FROM YOUR PHONE, MUST BE ON THE SAME NETWORK
									port = req.headers.host
									

									var confirmationLink = '<a href=http:\/\/' + port + '\/user/confirmationPage?id=' + token.token + '> Confirm your email here </a>';
									
									//create QR
									QRCode.toFile('./public/img/qrs/qr.png',confirmationLink , function (err) {
		  								if (err) {
		  									console.log('qr png was not created');
		  									console.log(err);
		  								}
		  								else {
		  									console.log('qr png created');
		  								}
									});

									

									var mailOptions = {
										
										from: 'confirmation@donotreply.com',
										to: email,
										subject: 'Account verification',
										html:'<p>Hello,\n\n' + 'Please verify your account by clicking the link' + confirmationLink + '\n\n' + '<img src="uniqueqr@qr.example"/>',
										//having issues with embedding the qr image into the email...opened question on stackoverflow.
										/*attachments: [{
											filename: 'qr.png',
											path: '../discord-devs/public/img/qrs/qr.png',
											cid: 'uniqueqr@qr.example'
										}],*/
									};

									mailTransporter.sendMail(mailOptions, function(err,info){
										if (err){
											console.log(err);
										}
										else {
											console.log('Email sent');
										}
									});

									//Success Message
									req.flash('success', 'You are registered please confirm with your email before you log in');

									// Redirect after register
									res.location('/');
									res.redirect('/');
								});
							}
						});
					}
					else{
						var err = {
								"msg" : "Email is already in use",
								"param" : "",
								"value" : "param.value",
								"location" : "body"
							};
						errors.push(err);
						res.render('login', {errors: errors});
					}
				});
			});	
		});
	}


});


module.exports = router;