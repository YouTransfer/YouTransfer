'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var q = require('q');
var _ = require('lodash');
var nconf = require('nconf');
var jwt = require('jwt-simple');
var crypto = require('crypto-js/sha256');
var LocalStrategy = require('passport-local').Strategy;
var youtransfer = require('./youtransfer');


// ------------------------------------------------------------------------------------------ Module Exposure

var exports = module.exports = (function() {

	var self = require('passport');
	self.strategies = {};

	// Authentication providers
	var providers = {

		list: ['facebook', 'google-oauth', 'spotify'],
		scopes: {
			'facebook': ['public_profile', 'email', 'user_friends'],
			'google-oauth': ['email', 'profile'],
			'spotify': ['user-read-email']
		},

		register: function(settings) {
			providers.list.forEach(function(provider) {
				if(settings.providers && settings.providers[provider] && settings.providers[provider].enabled) {
					var OAuthStrategy = require('passport-' + provider).OAuth2Strategy || require('passport-' + provider).Strategy;
					var strategy = new OAuthStrategy({
						clientID: settings.providers[provider].clientID,
						clientSecret: settings.providers[provider].clientSecret,
						callbackURL: settings.general.baseUrl + '/auth/' + provider + '/callback',
						scope: providers.scopes[provider]
					}, providers.callback(provider, settings.providers[provider].requireApproval, settings.providers[provider].allowRegistration));

					self.use(strategy);
					self.strategies[provider] = strategy;
				}
			});
		},

		callback: function(provider, approvalRequired, registrationAllowed) {
			return function(accessToken, refreshToken, profile, done) {
				profile.approvalRequired = approvalRequired;
				var user = User.import(provider, profile);

				// Persist user details
				var status = 'denied';
				var approved = youtransfer.users.exists(user.id, 'allowed');
				if(approved || (!approvalRequired && registrationAllowed)) {
					status = 'allowed';
				} else if(approvalRequired) {
					status = 'pending';
				}

				user.status = status;
				youtransfer.users.set(user.id, user, status);
				done(null, user);
			}
		}
	};

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

	// Configured strategies
	q.fcall(function() {
		var deferred = q.defer();
		youtransfer.settings.get(function(err, settings) {
			providers.register(settings);
			deferred.resolve();
		});
		return deferred.promise;
	}).done();

	youtransfer.settings.on('settings.push', function(err, settings) {
		if(!err) {
			providers.register(settings);
		}
	});

	return self;
})();

// ------------------------------------------------------------------------------------------ Private Class > User

function User(options) {
	this.id = options.id;
	this.provider = options.provider;
	this.username = options.username;
	this.displayName = options.displayName;
	this.firstname = options.firstname
	this.lastname = options.lastname;
	this.thumbnail = options.thumbnail;
	this.picture = options.picture;
	this.approved = options.approved;
}

User.import = function(provider, profile) {
	var user = new User({
		id: crypto(provider + ':' + profile.id).toString(),
		provider: provider,
		providerId: profile.id,
		username: profile.username || profile.displayName,
		displayName: profile.displayName || profile.username,
		approved: (profile.approvalRequired ? false : true)
	});

	if(provider === 'facebook') {
		_.assign(user, {
			firstname: profile.name.givenName,
			lastname: profile.name.familyName,
			thumbnail: 'http://graph.facebook.com/' + profile.id + '/picture?height=64',
			picture: 'http://graph.facebook.com/' + profile.id + '/picture',
		});
	} else if(provider === 'google-oauth') {
		_.assign(user, {
			username: (profile.emails && profile.emails[0]) ? profile.emails[0].value : profile.displayName,
			firstname: profile.name.givenName,
			lastname: profile.name.familyName,
			thumbnail: profile.photos ? profile.photos[0].value.replace('?sz=50','?sz=64') : '/assets/google.png',
			picture: profile.photos ? profile.photos[0].value.replace('?sz=50','') : '/assets/google.png',
		});
	} else if(provider === 'spotify') {
		_.assign(user, {
			thumbnail: (profile.photos.length > 0) ? profile.photos[0] : '/assets/spotify.png',
			picture: (profile.photos.length > 0) ? profile.photos[0] : '/assets/spotify.png',
		});
	}

	return user;
}

