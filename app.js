require('dotenv').config();
var express = require('express');
var path = require('path');
var expressValidator = require('express-validator');
var session = require('express-session');
var helmet = require('helmet');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var mongoose = require('mongoose');

//create app 
var app = express();

//conect to the mongo database
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex:true});
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function () {
  console.log('db is connected');
});


//define index route
var routes = require('./routes/index');
var user = require('./routes/user');

//header security
app.use(helmet());

//view engine

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//set static folder
app.use(express.static(path.join(__dirname, 'public')));  //stores images js and local css 
app.use('/css', express.static(__dirname + '/node_modules/w3-css')); //main css files


//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Express Session Middleware
app.use(session({
	secret: process.env.SESSION_SECRET,
	saveUninitialized: true,
	resave: true
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect-Flash Middleware
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Access Globals, not using yet
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});

//define routes
app.use('/', routes);
app.use('/user', user);

if (process.env.NODE_ENV == 'dev'){
	PORT = 3000; }
else {
	PORT = process.env.PORT;
}

app.listen(PORT);
console.log('server started on port:' + PORT);


