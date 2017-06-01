var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird'); 
Promise.promisifyAll(mongoose); 


var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: String,
    password: String,
    rank: { type: String, default: 'F'},
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    currentGame: {type: Number, default: -1},
    status: {type: String, enum:['none', 'inQueue', 'inGame'], default:'none'}

});

User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);