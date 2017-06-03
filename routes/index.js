var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var Match = require('../models/match');
var router = express.Router();
var pugGame = require('../game-code/pug-game');

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


function findMatch() {
  var match = Match.findAsync({'status': 'incomplete'});
  return match
}

function checkExisting(userId) {
  var userPromise = User.findByIdAsync(userId);
  return userPromise.then(function(data) {
       return {response: {status: data.status, game: data.currentGame}};
  });
}


module.exports = function(io) {
  io.on('connection', socketioJwt.authorize({
    secret: secretKey,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', function(socket) {
    console.log('logged in');
    //this socket is authenticated, we are good to handle more events from it.

    //search for user in queue.  If not there add and respond 
    //if user is there respond same but do not re-add
    socket.on('joinQueue', function(data) {
      var firstPromise =  checkExisting(socket.decoded_token.id)
      var findMatchPromise = firstPromise.then(function(data) {
        if (data.response.status == 'inQueue' && Number(data.response.game) > 0) {
          socket.emit('inQueue');
          socket.join(data.currentGame);
          console.log('Already in Queue');
/*          
          CAN BE USED TO TARGET PLAYER IN ARRAY IN UPDATE
          Match.update({roomName: data.currentGame, "players.userID": socket.decoded_token.id}
                       {$set: { "players.$."}})*/
          return true
        } else {
          return findMatch()
        }
      });
      findMatchPromise.then(function(data) {
        if (data == true) {
          return;
        } else if(data.length == 0) {
          pugGame.initGame(socket);
        } else {
          var game = pugGame.requestJoin(socket, data[0], io);
        }
      });
    })
  })
  return router;

}
