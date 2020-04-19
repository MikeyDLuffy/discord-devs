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
var mongojs = require('mongojs');
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var QRCode = require('qrcode');
const mailGun = require('nodemailer-mailgun-transport');
var { User, Token } = require('../models/User');
var Transaction = require('../models/Transaction');

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

//get user profile
router.get('/profile', ensureAuthenticated, function(req,res){
	res.render('profile');
});

//make sure the user is authenticated
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/login');
}

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
		res.render('register', {
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
									port = /*'10.0.0.232:3000'*/req.headers.host
									

									var confirmationLink = '<a href=http:\/\/' + port + '\/user/confirmation?token=' + token.token + '> Confirm your email here </a>';
									
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
										html:'<p>Hello,\n\n' + 'Please verify your account by clicking the link' + confirmationLink + '\n\n' + '</p>'		
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
						res.render('register', {errors: errors});
					}
				});
			});	
		});
	}


});

//Confirmation Get

router.get('/confirmation',
	function(req, res){
		Token.findOne({ token: req.query.token }, function (err, token) {
        if (!token) { 
        	req.flash('error', 'No token found, it may have expired');
	        res.redirect('/user/confirmationPage');
    	}
 
        else {
        	// If we found a token, find a matching user
	        User.findOne({ _id: token._userId }, function (err, user) {
	            if (!user) {
	            	req.flash('error', 'No user found');
	                	res.redirect('/user/confirmationPage');
	            }
	            else if (user.isVerified){
	            	req.flash('error', 'User is already verified <a href="/login"> register </a>');
	                res.redirect('/user/confirmationPage');
	            }
	 
	            // Verify and save the user
	            else {
	            	user.isVerified = true;
	            	user.save(function (err) {
		                if (err) { 
		                	req.flash('error', 'Sorry, something went wrong, we will yell at Dan');
		                	res.redirect('/user/confirmationPage'); 
		                }
		                else{
			                req.flash('success', 'You are verified, welcome! <a href="/login"> login </a>');
			                res.redirect('/user/confirmationPage');
		            	}
	            	});
	            }
	            
	        });
        }	
    	});
	}
);



//Serialize 
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
	User.findOne({_id: mongoose.Types.ObjectId(id)}, function(err, user){
		done(err, user);
	});
});


//passport local strategy  *the function says email, but the login form must have the name 'username'*
passport.use('user',new LocalStrategy(
	function(email, password, done){
		User.findOne({email: email}, function(err, user){
			if(err) {
				return done(err);
			}
			if(!user){
				return done(null, false, {message: 'Incorrect username'});
			}
			if(!user.isVerified){
					console.log('user not verified');
					return done(null, false, {message: 'Your account has not been verified.'}); 
			}
			else {
					bcrypt.compare(password, user.password, function(err, isMatch){
					if(err) {
						return done(err);
					}

					if(isMatch){
						return done(null, user);
									
					} 
					else {
						return done(null, false, {message: 'Incorrect password'});
					}
				});
			}
		});
	}
));







//login post
router.post('/login', 
	passport.authenticate('user', 
		{ 
			successRedirect: '../user/profile',
		  	failureRedirect: '../login',
			failureFlash: 'Invalid Username Or Password',
		}
	), function(req,res){
		console.log('Auth Successfull');
		res.cookies('user', user, {expire: 360000 + Date.now()}).send('cookie set');
		console.log(document.cookie);
		res.redirect('./user/profile');
	}
);

//logout post
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success','You have logged out');
	res.clearCookie('user');
	console.log('cookie cleared');
	res.redirect('/login');
});


module.exports = router;