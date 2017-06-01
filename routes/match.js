var express = require('express');
var router = express.Router();
var Match = require('../models/match');
var passport = require('passport');
var mongoose = require('mongoose');

/* GET users listing. */
router.get('/', passport.authenticate('jwt', {session: false}), function(req, res, next) {
	var s = new mongoose.mongo.ObjectID(req.user._id)
	console.log(s);
	Match.findOne(
		{'players.userID': s},
		function(err, data) {
			console.log(data); 
			res.json(data);
		});
});

module.exports = router;
