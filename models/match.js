var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird'); 
Promise.promisifyAll(mongoose); 

var Match = new Schema(
	{
	  players:
	  	[
		  	{
		  		userID: {type: Schema.Types.ObjectId, ref: 'User'}, 
		  		username: {type: String, required: true},
		  		vote: {type: Number, enum: [-1, 0, 1, 2], default: -1},
		  		team: {type: Number, enum: [1, 2]}
		  	}
	  	],
	  status: {type: String, enum: ['complete', 'incomplete'], default: 'incomplete'},
	  roomName: Number,
	  teamOneSize: Number,
	  teamTwoSize: Number,
	  votes: {type: Number, default: 0},
	  ended: {type: Boolean, default: false}
	 },
	{
		timestamps: {createdAt: 'created_at'}
	}
);

module.exports = mongoose.model('Match', Match);