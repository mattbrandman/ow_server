var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QueueEntry = new Schema(
	{
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    socketId: String,
    status: {type: String, enum:['waiting', 'in-match']},
    match: {type: mongoose.Schema.Types.ObjectId, ref: 'Match'},
	},
	{
		timestamps: {createdAt: 'created_at'}
	});

module.exports = mongoose.model('QueueEntry', QueueEntry);