'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var _ = require('lodash');
var nconf = require('nconf');
var jwt = require('jwt-simple');
var crypto = require('crypto-js/sha256');
var youtransfer = require('./youtransfer');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = (function() {

	var self = require('passport');

	// Serialization
	self.serializeUser(function(user, done) {
		done(null, user);
	});

	self.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	self.generateToken = function(user, done) {

		youtransfer.settings.get(function(err, settings) {

			_.assign(user, {
				exp: new Date().add({ minutes: 20 }).getTime()
			});

			var security = settings.security || {};
			var salt = security.encryptionKey || '';
			var payload = jwt.encode(user, salt);
			done(null, payload);

		});
	};

	// Persist user session with cookie
	self.use(new RememberMeStrategy({
			key: 'token',
			cookie: {
				path: '/',
				expires: new Date().add({ minutes: 20 }),
				secure: (nconf.get('NODE_ENV') == "production"),
				httpOnly: true,
				maxAge: 1200
			}
		},
		function(token, done) {

			youtransfer.settings.get(function(err, settings) {

				var security = settings.security || {};
				var salt = security.encryptionKey || '';
				var user = jwt.decode(token, salt);
				done(null, user);

			});

		},
		self.generateToken

	));

	// Local Strategy
	self.use(new LocalStrategy(
		function(username, password, done) {

			youtransfer.settings.get(function(err, settings) {

				var security = settings.security || {};
				var salt = security.encryptionKey || '';
				var hash = crypto(password + salt).toString();

				if(username === security.rootAccount) {
					if(hash === security.rootPassword) {
						self.generateToken({
							username: username
						}, done);
					} else {
						done(new Error('Invalid password'));
					}
				} else {
					done(new Error('Invalid username'));
				}

			});

		}
	));

	return self;
})();
