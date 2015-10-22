'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var _ = require('lodash');
var http = require('http');
var jwt = require('jwt-simple');
var crypto = require('crypto-js/sha256');
var passport = require('../../lib/passport');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var youtransfer = require('../../lib/youtransfer');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Passport module', function() {
	var sandbox;
	var request;
	var incomingMessage;

	before(function() {
		var req = http.IncomingMessage.prototype;
		incomingMessage = _.assign({}, req);
	});

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		request = _.assign({}, incomingMessage);
	});

	afterEach(function() {
		sandbox.restore();
	});

	// -------------------------------------------------------------------------------------- Testing local authentication

	it('should be possible to authenticate a user based on the request body', function(done) {

		var req = _.assign({}, request, {
				body: {
					username: 'a',
					password: 'a'
				},
				session: {}
			}),
			res = {};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				security: {
					encryptionKey: 'MySecretKey',
					rootAccount: 'a',
					rootPassword: crypto('a' + 'MySecretKey').toString()
				}
			});
		});

		passport.initialize()(req, res, function() {
			passport.session()(req, res, function() {
				passport.authenticate('local')(req, res, function() {
					should.exist(req.user);
					req.user.username.should.equals('a');
					done();
				});
			});
		});
	});

	it('should not be possible to authenticate a user based on the request body without encryptionKey', function(done) {

		var req = _.assign({}, request, {
				body: {
					username: 'a',
					password: 'a'
				},
				session: {}
			}),
			res = {};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				security: {
					rootAccount: 'a',
					rootPassword: crypto('a').toString()
				}
			});
		});

		passport.initialize()(req, res, function() {
			passport.session()(req, res, function() {
				passport.authenticate('local')(req, res, function(err) {
					should.exist(err);
					err.message.should.equals('Require key');
					done();
				});
			});
		});
	});	

	// -------------------------------------------------------------------------------------- Testing session authentication

	it('should be possible to authenticate a user from the session object', function(done) {

		var req = _.assign({}, request, {
				session: {
					passport: {
						user: jwt.encode({ username: 'a' }, 'MySecretKey')
					}
				}
			}),
			res = {};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				security: {
					encryptionKey: 'MySecretKey',
				}
			});
		});

		passport.initialize()(req, res, function() {
			passport.session()(req, res, function() {
				should.exist(req.user);
				req.user.username.should.equals('a');
				done();
			});
		});
	});

	it('should not be possible to authenticate a user from the session object without encryptionKey', function(done) {

		var req = _.assign({}, request, {
				session: {
					passport: {
						user: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImEiLCJleHAiOjE0NDUwNzU3MzU5MTZ9.WcqE_QsviROqTGNv6DyxBY9yS8MvvQXIpvnO8XEX8fg'
					}
				}
			}),
			res = {};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {});
		});

		passport.initialize()(req, res, function() {
			passport.session()(req, res, function() {
				should.not.exist(req.user);
				done();
			});
		});
	});	

	it('should not be possible to authenticate a user from the session object if the JWT token expired', function(done) {

		var req = _.assign({}, request, {
				session: {
					passport: {
						user: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImEiLCJleHAiOjE0NDUwNzU3MzU5MTZ9.WcqE_QsviROqTGNv6DyxBY9yS8MvvQXIpvnO8XEX8fg'
					}
				}
			}),
			res = {};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				security: {
					encryptionKey: 'MySecretKey',
				}
			});
		});

		passport.initialize()(req, res, function() {
			passport.session()(req, res, function() {
				should.not.exist(req.user);
				done();
			});
		});
	});	

});