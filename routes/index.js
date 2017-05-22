var express = require('express');
var passport = require('passport');
var User = require('../models/user');
var QueueEntry = require('../models/queue-entry');
var router = express.Router();

var jwt = require('jsonwebtoken');
var socketioJwt = require("socketio-jwt");
secretKey = 'teatime';



router.post('/register', function(req, res) {
  User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
    if (err) {
      return res.render('register', { user : user });
    }

    passport.authenticate('local')(req, res, function () {
      var payload = {id: req.user.id};
      var token = jwt.sign(payload, secretKey);
      res.json({message: "ok", token: token});
    });
  });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  var payload = {id: req.user.id};
  var token = jwt.sign(payload, secretKey);
  res.json({message: req.user.id, token: token});
});

router.get('/profile', passport.authenticate('jwt', {session: false}), function(req, res, next) {
  res.json({message: "success", user: req.user});
});



module.exports = function(io) {
  io.on('connection', socketioJwt.authorize({
    secret: secretKey,
    timeout: 15000 // 15 seconds to send the authentication message
  }))
  .on('authenticated', function(socket) {
    //this socket is authenticated, we are good to handle more events from it.

    //search for user in queue.  If not there add and respond 
    //if user is there respond same but do not re-add
    QueueEntry.findOne({'user': socket.decoded_token.id}, function(err, qe) {
      if (err) {
        return done(err, false);
      }
      if (qe) {
        socket.emit('message', {data: 'in queue (already queued)'});
      } else {
        var queueEntry = new QueueEntry({user: socket.decoded_token.id});
        queueEntry.save(function(err) { if (err) console.log(err); });
        socket.emit('message', {data: 'in queue'});
      }
    });

  })
  .on('unauthorized', function(msg) {
      console.log("unauthorized: " + JSON.stringify(msg.data));
      throw new Error(msg.data.type);
    });
  return router;

}
