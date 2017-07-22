var Match = require('../models/match');
var mongoose = require('mongoose');
var User = require('../models/user');
var Promise = require('bluebird'); 
var QueueServer = require('../game-code/queue-server');
var socketManager = require('../game-code/socketio-manager');
var queueItem = require('../models/queue-item');

class GameServer {
	constructor() {
		this.queueServer = QueueServer;
		this.gameList = {};
		this.queueServer.on('new-game', game => this.newGame(game));
		socketManager.on('newQueueItem', socket => this.new_queue_item(socket));
		this.userToGameList = {}
	}

	newGame(game) {
		this.game = game.Game;
		this.gameList[game.Game['name']] = this.game;
		this.game['vote1'] = 0
		this.game['vote2'] = 0
		this.game['vote3'] = 0
		this.game['voteList'] = [];
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
		var game = this.gameList[gameName.toString()]
		var existing = this.game.voteList.indexOf(user.id.toString())
		if (existing == -1 ) {
			this.game.voteList.push(user.id.toString());
			if (vote == 1 ) {
				game['vote1'] += 1
			} else if (vote == 2) {
				game['vote2'] += 1
			} else if (vote == 3) {
				game['vote3'] += 1
			}
			if (game['vote1'] + game['vote2'] + game['vote3'] == 1) {
				setTimeout(() => this.game_end(this.game), 5000);
			}
		}
	}

	game_end(game) {
		var winner = 0
		if (game.vote1 > game.vote2 && game.vote1 > game.vote3) {
			winner = 1
		} else if (game.vote2 > game.vote1 && game.vote2 > game.vote3) {
			winner = 2
		} else if (game.vote3 > game.vote1 && game.vote3 > game.vote2) {
			winner = 3
		}
		
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
			} else if (winner == 3) {
				User.findByIdAndUpdateAsync(Team2[i]._id, {$inc: {draws: 1}})
				User.findByIdAndUpdateAsync(Team1[i]._id, {$inc: {draws: 1}})
			}
		}
		socketManager.message_to_room(game['name'], 'gameOver', {})
		delete this.gameList[game['name'].toString()]
	}

    new_queue_item(socket) {
        var dbUserId = new mongoose.mongo.ObjectId(socket.decoded_token.id)
        var latestGame = this.userToGameList[socket.decoded_token.id.toString()]
        console.log(latestGame);
        if (latestGame != undefined) {
        	var existingGame = this.gameList[latestGame.toString()]
        	console.log(existingGame);
        	console.log('yyyy')
        	console.log(this.gameList);
        } else {
        	var existingGame = undefined
        }
        if (existingGame == undefined) {
            var check_existing = queueItem.findOneAsync({user: dbUserId})
            
            check_existing.then(function(data) {
                if (data == null) {
                    queueItem.createAsync({ user: new mongoose.mongo.ObjectId(socket.decoded_token.id) });
                } 
            });
        } else {
            socket.emit('gameStart', existingGame);
        }
    }

}

module.exports = new GameServer();





