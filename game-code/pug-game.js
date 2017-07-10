var Match = require('../models/match');
var mongoose = require('mongoose');
var User = require('../models/user');
var Promise = require('bluebird'); 
var app = require('../app');
var io = app.io;
var cancelTimer = '';
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
	requestJoin: function(socket, match) {

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
			team: team
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

	gameReadyCheck: function(match) {
		var readyUsers = [];
		var match = match;
		cancelTimer = setTimeout(
												function(io, match){
													this.cancelGame(io, match);
												}.bind(PugGame), 10000, match, io);
		console.log('Ready Checking')
		io.in(match.roomName).emit('readyCheck');
	},

	cancelGame: function(match) {
		io.in(match.roomName).emit('gameCanceled');
		User.updateManyAsync({currentGame: Number(match.roomName)}, {currentGame: -1, status: 'none'});
	},

	startGame: function(match) {
		clearTimeout(cancelTimer);
		var match = match;
		var startPromise = User.updateManyAsync({currentGame: Number(match.roomName)}, {status: 'InGame'});
		startPromise.then(data => io.in(match.roomName.toString()).emit('gameStarted'));
	},

	endGame: function(roomName) {
		console.log('ending');
		var roomNameParam = roomName;
		var room = roomName.toString();
		/*
		Map Reduce Function to determine vote counts
		*/
		var o = {};
		o.map = function () {
			this.players.forEach(function(player){
				emit(player.vote, 1);
			})
		}
		o.reduce = function (k, vals) {
			return vals.length
		}
		o.query = {roomName: roomNameParam};

		/*
		End of game code
		*/
		var fullMatchPromise = Match.findOneAsync({roomName: roomNameParam});
		var matchCompletePromise = Match.updateAsync({roomName: roomNameParam}, {ended: true});
		
		//Determines winner by simple majority using map reduce ignores non votes 
		matchCompletePromise.then(function(data) {
			Match.mapReduce(o, function (err, results) {
				var winningTeam;
				var winningTeamValue = -99;
				if(err) throw err;
				results.forEach(function(result) {
					if (((result._id == 0) || (result._id == 1) || (result._id == 2)) && result.value > winningTeamValue ) {
						winningTeam = result._id;
						winningTeamValue = result.value;
					}
				});

				//Gets the full match and updates all users based on winning team
				//Resets player states and emits game over signal
				fullMatchPromise.then(data => {
					var promiseArray = [];
					data.players.forEach(function(player) {
						if (player.team == winningTeam) {
							var curPromise = User.updateAsync({_id: player.userID}, {status: 'none', currentGame: -1, $inc: {wins: 1}})
							promiseArray.push(curPromise);
						} else {
							var curPromise = User.updateAsync({_id: player.userID}, {status: 'none', currentGame: -1, $inc: {losses: 1}})
							promiseArray.push(curPromise);
						}
					});
					Promise.all(promiseArray).then(data => io.in(room).emit('gameOver'));
				});
			})
		});
	}
}


module.exports = PugGame;





