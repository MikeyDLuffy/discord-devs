//Transaction Schema
var mongoose = require('mongoose');
var User = require('../models/User');

var transactionSchema = mongoose.Schema({
	creator: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    participants: [
        {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    ],
    password: String, 
    creationDate: { type: Date, default: Date.now },
    isComplete: {type: Boolean, default: false},
    pin: {type: Number},
    token: {type: String, required:true}
});


var Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;