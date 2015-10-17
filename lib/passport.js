'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var _ = require('lodash');
var nconf = require('nconf');
var jwt = require('jwt-simple');
var youtransfer = require('./youtransfer');
var LocalStrategy = require('passport-local').Strategy;

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = (function() {

	var self = require('passport');

	// Serialization
	self.serializeUser(function (user, done) {

		youtransfer.settings.get(function(err, settings) {

			_.assign(user, {
				exp: new Date().add({ minutes: 20 }).getTime()
			});

			var security = settings.security;
			var salt = security.encryptionKey;
			var payload = jwt.encode(user, salt);
			done(null, payload);

		});

	});

	self.deserializeUser(function (token, done) {

		youtransfer.settings.get(function(err, settings) {

			var security = settings.security || {};
			var salt = security.encryptionKey || '';
			var user = jwt.decode(token, salt);

			// Check for JWT expiration
			var expires = new Date(user.exp);
			if(Date.compare(expires, new Date()) < 0) {
				user = null;
			}

			done(null, user);

		});

	});

	// Local Strategy
	self.use(new LocalStrategy(youtransfer.authenticate));

	return self;
})();
