var Match = require('../models/match');
var mongoose = require('mongoose');
var User = require('../models/user');

var PugGame = {

	//starts the game and adds client to room
	initGame: function(socket) {
		var user = socket.decoded_token
		var socket = socket
		var player = {
			userID: new mongoose.mongo.ObjectId(user.id),
			username: user.username,
			team: 1
		}
		
		var roomName = Math.floor(Math.random() * 10000) + 1  
		var matchPromise = Match.createAsync({players: [player], status:'incomplete', 
																					roomName: roomName, teamOneSize: 1, teamTwoSize: 0});
		matchPromise.then(function(data) {
			console.log('New Game Created');
	  		User.updateAsync({_id: user.id}, {status: 'inQueue', currentGame: roomName}).then(
	  			function(data){
	  				console.log('User Updated');
	  			});
			socket.join(roomName);
		})
	},

	//Decides if a client gets to join a game
	//Also starts a game if the 12th client has just joined
	requestJoin: function(socket, match, io) {

		var match = match
		var team = 1;
		var teamToIncrement = 'teamOneSize';
		var newStatus = 'incomplete';
		if ((Number(match.teamOneSize) + Number(match.teamTwoSize)) == 1) {
			newStatus = 'complete';
		} 
		if (match.teamOneSize > match.teamTwoSize) {
			team = 2;
			teamToIncrement = 'teamTwoSize';
		}
		var user = socket.decoded_token
		//add validation
		var player = {
			userID: new mongoose.mongo.ObjectId(user.id),
			username: user.username,
			team: 1
		}
		var promise =	Match.updateAsync(
										{_id: match._id, players: {$size: match.players.length}},
										{ $push: {players: player}, $inc: {[teamToIncrement]: 1}, status: newStatus});
		promise.then(
			function (raw) {
	  		console.log('The raw response from Mongo was ', raw);
	  		console.log(user.id);
	  		var x = new mongoose.mongo.ObjectId(user.id)
	  		User.updateAsync({_id: user.id}, {status: 'inQueue', currentGame: match.roomName}).then(
	  			function(data){
	  				console.log('User Updated');
	  			});
	  		socket.join(match.roomName);
	  		if (newStatus == 'complete') {
	  			this.gameReadyCheck(match, io);
	  		}
			}.bind(PugGame))
	},

	gameReadyCheck: function(match, io) {
		var readyUsers = [];
		var match = match;
		var io = io;
		var cancelTimer = setTimeout(
												function(io, match){
													this.cancelGame(io, match);
												}.bind(PugGame), 10000, match, io);
		console.log('Ready Checking')
		io.in(match.roomName).emit('readyCheck');
		io.of('/').in(match.roomName).clients(function(error, clients){
		  clients.forEach(function(client) {
		  	var currentSocket = io.of('/').connected[client]
		  	currentSocket.once('Ready', function(data) {
		  		if (readyUsers.indexOf(currentSocket.decoded_token.id) > -1) {
		  			console.log(currentSocket.decoded_token.id + ' already responded')
		  		} else {
		  			readyUsers.push(currentSocket.decoded_token.id);
		  			console.log(currentSocket.decoded_token.id + ' is ready');
		  			console.log(readyUsers);
		  		}
		  		if (readyUsers.length == 2) {
		  			clearTimeout(cancelTimer);
		  			this.startGame(match, io);
		  		}
		  	}.bind(PugGame));
		  }); 
		})
	},

	cancelGame: function(match, io) {
		io.in(match.roomName).emit('gameCanceled');
		User.updateManyAsync({currentGame: Number(match.roomName)}, {currentGame: -1, status: 'none'});
	},

	startGame: function(match, io) {
		var match = match;
		var io = io;
		io.in(match.roomName).emit('gameStarted');
		io.of('/').in(match.roomName).clients(function(error, clients){
			clients.forEach(function(client) { 
				var currentSocket = io.of('/').connected[client]
			})
		})

	}
}


module.exports = PugGame;