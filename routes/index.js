var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var Match = require('../models/match');
var router = express.Router();
var pugGame = require('../game-code/pug-game');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var socketioJwt = require("socketio-jwt");
secretKey = 'teatime';



router.post('/register', function(req, res) {
  User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
    if (err) {
      return res.render('register', { user : user });
    }

    passport.authenticate('local')(req, res, function () {
      var payload = {id: req.user.id, username: req.user.username};
      var token = jwt.sign(payload, secretKey);
      res.json({message: "ok", token: token});
    });
  });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  var payload = {id: req.user.id, username: req.user.username};
  var token = jwt.sign(payload, secretKey);
  res.json({message: req.user.id, token: token});
});

router.get('/profile', passport.authenticate('jwt', {session: false}), function(req, res, next) {
  res.json({message: "success", user: req.user});
});



module.exports = router