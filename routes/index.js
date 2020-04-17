require('dotenv').config();
var express = require('express');
var router = express.Router();
var path = require('path');
var expressValidator = require('express-validator');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var mongoose = require('mongoose');

//conect to the mongo database
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex:true});
var db = mongoose.connection;


//get login page
router.get('/', function (req, res) {
	res.render('login');
});


module.exports = router;