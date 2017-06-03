var express = require('express');
var router = express.Router();
var Match = require('../models/match');
var passport = require('passport');
var mongoose = require('mongoose');

/* GET users listing. */
router.get('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
    var userId = new mongoose.mongo.ObjectID(req.user._id)
    Match.findOne(
    	{ 'players.userID': userId },
      'players.userID players.username players.team',
      function(err, data) {
          res.json(data);
      });
});

module.exports = router;

router.post('/vote', passport.authenticate('jwt', { session: false }), function(req, res) {
	  var votePromise = Match.updateAsync(
	  	{ roomName: req.user.currentGame, "players.userID": req.user._id }, 
	  	{ $set: { "players.$.vote": req.body.winning_team } },
	    function(err, data) {
	    	res.json({response: 'Vote Accepted'})
	    });
});
