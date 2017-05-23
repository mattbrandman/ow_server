var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Match = new Schema(
	{
    teamA: 
    [
	    {
	    	user: {type: Schema.Types.ObjectId, ref: 'User'}, 
	    	socketId: String
	    }
	  ],
    teamB: 
    [
	    {
	    	user: {type: Schema.Types.ObjectId, ref: 'User'}, 
	    	socketId: String
	    }
	  ],
	  votes: 
    [
	    {
	    	user: {type: Schema.Types.ObjectId, ref: 'User'}, 
	    	socketId: String,
	    	winningTeam: { type: Number, enum: [1, 2] }
	    }
	  ],
	},
	{
		timestamps: {createdAt: 'created_at'}
	});

module.exports = mongoose.model('Match', Match);