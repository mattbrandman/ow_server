var express = require('express');
var router = express.Router();
var Match = require('../models/match');
var passport = require('passport');
var mongoose = require('mongoose');
var gameController = require('../game-code/pug-game');

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


router.post('/vote', passport.authenticate('jwt', { session: false }), function(req, res) {
    var req = req;
    setTimeout(function(){ gameController.endGame(req.user.currentGame, req.app.io)}, 5000);
	  var votePromise = Match.findOneAndUpdateAsync(
	  	{ roomName: req.user.currentGame, "players.userID": req.user._id, ended: false }, 
	  	{ $set: { "players.$.vote": req.body.winning_team }, $inc: {votes: 1} },
      { new: true });
    votePromise.then(function(data)
    {
      if (true) {
        
      }
      res.json({response: 'Vote Accepted'})
    });
});


module.exports = router;