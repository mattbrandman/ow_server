var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QueueEntry = new Schema(
	{
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	},
	{
		timestamps: {createdAt: 'created_at'}
	});

module.exports = mongoose.model('QueueEntry', QueueEntry);