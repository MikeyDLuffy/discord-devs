//User Schema
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
    },
    password: String, 
    creationDate: { type: Date, default: Date.now },
    isVerified: {type: Boolean, default: false},
    passwordResetToken: String,
    PasswordResetExpires: Date,
});


const tokenSchema = mongoose.Schema({
    _userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    token: {type: String, required: true},
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});

const Token = mongoose.model('Token', tokenSchema);
var User = mongoose.model('User', userSchema);

module.exports = {Token, User};