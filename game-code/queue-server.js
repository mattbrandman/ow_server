var queueItem = require('../models/queue-item');
var match = require('../models/match');
const EventEmitter = require('events')
const util = require('util')

class QueueServer extends EventEmitter {
	constructor () {
		super()
		setInterval(() => this.create_game(), 5000)
	}

	create_game() {
		var playersPromise = queueItem.find().populate('user').execAsync();
		var found_players = [];
		var x = 1
		playersPromise.then(players => {
			if (players.length == 2) {
				console.log('creating game')
				var successfully_added_players = 0;
				for(var i=0; i < players.length; i++) {
					var deletePromise = queueItem.findOneAndRemove({_id: players[i]._id}).populate('user').execAsync();
					deletePromise.then(doc => {
						if(doc != null) {
							successfully_added_players += 1;
							found_players.push(doc.user);
							if(successfully_added_players == 2) {
								this.balance_game(found_players);
							}
						}
					})
				}
			} else {
				console.log(players);
			}
		})
	}

	balance_game(players) {
		var team1 = [];
		var team2 = [];
		for (var i=0; i < players.length; i++) {
			if(i % 2 == 0) {
				team1.push(players[i]);
			} else {
				team2.push(players[i]);
			}
		}
		var gameName = Math.floor((Math.random() * 100) + 1);
		console.log({Game: {Team1: team1, Team2: team2, name: gameName.toString()}});
		this.emit('new-game', {Game: {Team1: team1, Team2: team2, name: gameName.toString()}});
	}

}
module.exports = new QueueServer();