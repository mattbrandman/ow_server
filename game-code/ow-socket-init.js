/*var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var socketioJwt = require("socketio-jwt");
var User = require('../models/user');
var Match = require('../models/match');
var pugGame = require('../game-code/pug-game');
var gSInit = require('../game-code/game-socket-init');
var queueItem = require('../models/queue-item');
var app = require('../app');
var io = app.io;
secretKey = 'teatime';

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

module.exports = function() {
  io.on('connection', socketioJwt.authorize({
    secret: secretKey,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', function(socket) {
    console.log(socket.id);
    console.log('logged in');
    var userId = new mongoose.mongo.ObjectId(socket.decoded_token.id)
    var userPromise = User.findOneAsync({_id: userId})
    userPromise.then(function(data) {
      if (data.status != 'none' && data.currentGame != -1) {
        socket.join(data.currentGame);
      }

      gSInit(socket);

    //this socket is authenticated, we are good to handle more events from it.

    //search for user in queue.  If not there add and respond 
    //if user is there respond same but do not re-add
      socket.on('joinQueue', function(data) {
        queueItem.createAsync({user: new mongoose.mongo.ObjectId(socket.decoded_token.id)});
      });
    })
  })
}*/