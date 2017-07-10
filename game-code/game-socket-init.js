var ReadyClass = require('../game-code/ready-class');
var mongoose = require('mongoose');
var Match = require('../models/match');
var User = require('../models/user');
var pugGame = require('../game-code/pug-game');
var readyHashTable = {}


function gSInit(socket) {
	socket.on('Ready', function(data) {
		var userId = socket.decoded_token.id; 
		var userIdObject = new mongoose.mongo.ObjectId(socket.decoded_token.id); 
		var userPromise = User.findByIdAsync(userId);
		var matchPromise = userPromise.then(function(data){
												return Match.findOneAsync({'players.userID': userIdObject, 'roomName': data.currentGame, 'ended': false});
											 })
		var match;
		matchPromise.then(function(data){
			if (data == null) {
				return true
			} else {
				match = data;
			}
			if (readyHashTable[match.roomName] == null){
				var readyClass = new ReadyClass();
				readyClass.readyChecks.push(userId);
				readyHashTable[match.roomName] = readyClass;
			} else {
				if (readyHashTable[match.roomName].readyChecks.includes(userId) == false) {
					readyHashTable[match.roomName].readyChecks.push(userId);
				}

				if (readyHashTable[match.roomName].readyChecks.length == 2) {
					pugGame.startGame(match);
				}
			}
		});
	});
}

module.exports = gSInit;