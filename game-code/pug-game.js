var Match = require('../models/match');
var mongoose = require('mongoose');
var User = require('../models/user');
var Promise = require('bluebird'); 
var QueueServer = require('../game-code/queue-server');
var socketManager = require('../game-code/socketio-manager');

class GameServer {
	constructor() {
		this.queueServer = QueueServer;
		this.gameList = {};
		this.queueServer.on('new-game', game => this.newGame(game));
		this.userToGameList = {}
	}

	newGame(game) {
		this.gameList[game.Game['name']] = game.Game
		console.log('here');
		this.game = game.Game;
		this.game['vote1'] = 0
		this.game['vote2'] = 0
		for(var i=0; i < this.game['Team1'].length; i++) {
			socketManager.join_room(this.game['Team1'][i], this.game['name'])
			socketManager.join_room(this.game['Team2'][i], this.game['name'])
			this.userToGameList[this.game['Team1'][i].id] = this.game['name']
			this.userToGameList[this.game['Team2'][i].id] = this.game['name']
		}
		socketManager.message_to_room(this.game['name'], 'gameStart', this.game);
	}

	game_vote(user, vote) {
		var gameName = this.userToGameList[user.id.toString()]
		console.log('xxx')
		console.log(gameName)
		var game = this.gameList[gameName.toString()]
		console.log(this.gameList);
		console.log(game);
		if (vote == 1 ) {
			game['vote1'] += 1
		} else if (vote == 2) {
			game['vote2'] += 1
		}
		if (game['vote1'] + game['vote2'] == 1) {
			setTimeout(() => this.game_end(this.game), 5000);
		}
	}

	game_end(game) {
		var winner = game.vote1 > game.vote2 ? 1 : 2;
		var innerGame = game.Game;
		var Team1 = game.Team1
		var Team2 = game.Team2
		for (var i = 0; i < game.Team1.length; i++) {
			if (winner == 1) {
				User.findByIdAndUpdateAsync(Team1[i]._id, {$inc: {wins: 1}})
				User.findByIdAndUpdateAsync(Team2[i]._id, {$inc: {losses: 1}})
			} else if (winner == 2) {
				User.findByIdAndUpdateAsync(Team2[i]._id, {$inc: {wins: 1}})
				User.findByIdAndUpdateAsync(Team1[i]._id, {$inc: {losses: 1}})
			}
		}
		socketManager.message_to_room(game['name'], 'gameOver', {})
		delete this.gameList[game['name'].toString()]
	}

}
var gsInstance = new GameServer();
module.exports = gsInstance;





