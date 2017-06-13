var express = require('express');
var router = express.Router();
var User = require('../models/user')
var passport = require('passport');

/* GET users listing. */
router.get('/self',  passport.authenticate('local'), function(req, res, next) {
  res.json(req.user);
});

module.exports = router;
