var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Promise = require('bluebird'); 
Promise.promisifyAll(mongoose); 


var passportLocalMongoose = require('passport-local-mongoose');

var QueueItem = new Schema(
	{
		user: {type: Schema.Types.ObjectId, ref: 'User'},
		constraint: Number,

	},
	{
		timestamps: {createdAt: 'created_at'}
	}

);

module.exports = mongoose.model('QueueItem', QueueItem);