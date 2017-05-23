var kue = require('kue-scheduler');
var queueEntry = require('../models/queue-entry');
var Match = require('../models/match');
var User = require('../models/user');

var kueStart = function(io) {
	var Queue = kue.createQueue();
	Queue.clear(function(error, response){
		console.log(response);
	})

	//create a job instance
	var createMatchJob = Queue
	            .createJob('createMatch', "yes")
	            .attempts(3)
	            .priority('normal');

	//schedule it to run every 2 seconds
	Queue.every('10 seconds', createMatchJob);


	function callBack(userList) {
		console.log(userList);
		if (userList.length >= 2) {
			var match = new Match({teamA: [], teamB: []})
			for (var i = 0, len = userList.length; i < len; i++){
				var currentUser = userList[i]
				queueEntry.update({user: currentUser.user}, 
													{status: 'in-match'}, 
													function(err, data){
														if (err) console.log(err);
													});
				match.teamA.push(currentUser);
				io.to(currentUser.socketId).emit('message', {data: 'found game'});
			}
			match.save(function(err) { if (err) console.log(err); });
		}
	}

	//somewhere process your scheduled jobs
	Queue.process('createMatch', function(job, done) {
		queueEntry
			.find({'status': 'waiting'}, 
				'user socketId',
				function(err, data)
					{
						callBack(data);
					})
			.limit(12);
		done()
	});



}

module.exports = kueStart;