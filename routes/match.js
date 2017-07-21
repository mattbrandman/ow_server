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
    	{ 'players.userID': userId, 'roomName': req.user.currentGame },
      'players.userID players.username players.team',
      function(err, data) {
          res.json(data);
      });
});


router.post('/vote', passport.authenticate('jwt', { session: false }), function(req, res) {
  gameController.game_vote(req.user, req.body.winning_team)
  res.json({data: 'vote recorded'});
});


module.exports = router;