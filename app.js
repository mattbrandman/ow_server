var express = require('express');
var socket_io = require("socket.io");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bodyParser = require('body-parser')

var passportJWT = require("passport-jwt");
var User = require('./models/user');

var users = require('./routes/users');

var app = express();

var io = socket_io();
app.io = io;
module.exports = app;

var gameServer = require('./game-code/pug-game')
var index = require('./routes/index');
var match = require('./routes/match'); 

app.use(passport.initialize());
app.use(bodyParser.json());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



var jwtOptions = {}
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('Bearer');
jwtOptions.secretOrKey = 'teatime';

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
    User.findById(jwt_payload.id, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
            // or you could create a new account 
        }
    });
}));

mongoose.connect('mongodb://Farid:harris23@ds117093.mlab.com:17093/ow_server_database')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/match', match);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
