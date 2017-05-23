var express = require('express');
var router = express.Router();
var Match = require('../models/match');
var passport = require('passport');
var mongoose = require('mongoose');

/* GET users listing. */
router.get('/', passport.authenticate('jwt', {session: false}), function(req, res, next) {
	Match.findOne({$or: [{'teamA.user': new mongoose.mongo.ObjectID(req.user)},
										{'teamB.user': new mongoose.mongo.ObjectID(req.user)},
										]}, function(data) {console.log(data); res.json(data);});
});

module.exports = router;
