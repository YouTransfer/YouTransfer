'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var settings = require('../../lib/settings');
var path = require('path');
var crypto = require('crypto-js/sha256');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var fs = require('fs');
var nconf = require('nconf');
nconf.argv()
	 .env();
nconf.set('basedir', __dirname);

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Settings module', function() {
	var sandbox;
	var title = "My Awesome Title";

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	})

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should be possible to set options by string', function() {
		var instance = settings.getInstance('./test/modules/settings.json');
		instance.options.path.should.equal('./test/modules/settings.json');
	});

	it('should be possible to set options by object', function() {
		var instance = settings.getInstance({
			path: './test/modules/settings.json'
		});		
		instance.options.path.should.equal('./test/modules/settings.json');
	});

	it('should not be possible to set options by integer', function() {
		try {
			var instance = settings.getInstance(100);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
		}
	});

	// -------------------------------------------------------------------------------------- Testing write

	it('should be possible to set title', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.title.should.equals('title');
			callback(null);
		});

		settings.push({ 
			general: {
				title: 'title'
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should still be possible to set title if settings file does not exist', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.title.should.equals('title');
			callback(null);
		});

		settings.push({ 
			general: {
				title: 'title'
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should throw an error if it current settings file is not valid', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, 'this is not json and should produce an error');
		});

		settings.push({ 
			general: {
				title: 'title'
			}
		}, function(err) {
			should.exist(err);
			err.message.should.equals('Unexpected token h');
			done();
		});
	});

	it('should throw an error if it is not possible to write settings file', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.title.should.equals('title');
			callback(new Error('error'));
		});

		settings.push({ 
			general: {
				title: 'title'
			}
		}, function(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing read

	it('should be possible to get title fom cache', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null, {
				general: {
					title: title,
				},
				storage: {
					localstoragepath: path.join(__dirname, '/uploads/')
				}
			});
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.general.title.should.equal(title);
			done();
		});
	});

	it('should be possible to get title fom file system', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					title: title,
				},
				storage: {
					localstoragepath: path.join(__dirname, '/uploads/')
				}
			}));
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.general.title.should.equal(title);
			done();
		});
	});

	it('should not be possible to get title if invalid JSON is returned', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, 'this is not JSON');
		});

		settings.get(function(err, output) {
			should.exist(err);
			err.message.should.equals('Unexpected token h');
			done();
		});
	});

	it('should still be possible to get title if settings file does not exist', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		sandbox.stub(nconf, 'get').returns({
			general: {
				title: 'title' 
			},
			storage: {
				localstoragepath: path.join(__dirname, '/uploads/')
			}
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.general.title.should.equals('title');
			done();
		});
	});

	it('should still be possible to get localstoragepath if settings file does not exist', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		sandbox.stub(nconf, 'get').returns({ 
			general: {
				title: 'title'
			},
			storage: {
				localstoragepath: './somepath' 
			}
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.storage.localstoragepath.should.equals(path.join(__dirname, '../../somepath'));
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing localstoragepath

	it('should be possible to set relative localstoragepath', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					basedir: __dirname
				},
				storage: {
					localstoragepath: './uploads'
				}
			}));
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			done();
		});
	});

	it('should not be able to use invalid localstoragepath setting', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					basedir: __dirname
				},
				storage: {
					localstoragepath: 100
				}
			}));
		});

		settings.get(function(err, output) {
			should.exist(err);
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing fixBooleanValues

	it('should be possible to set boolean value to true explicitely', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					booleanValue: true
				}
			}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.booleanValue.should.equals(true);
			callback(null);
		});

		settings.push({ 
			general: {
				booleanValue: true 
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should be possible to set boolean value to false explicitely', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					booleanValue: true
				}
			}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.booleanValue.should.equals(false);
			callback(null);
		});

		settings.push({
			general: {
				booleanValue: false 
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should be possible to set boolean value to false by omission', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					booleanValue: true
				}
			}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.booleanValue.should.equals(false);
			callback(null);
		});

		settings.push({
			general: {}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should not be possible to set boolean value to false by omission if section does not exist', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				general: {
					booleanValue: true
				}
			}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			settings.general.booleanValue.should.equals(true);
			callback(null);
		});

		settings.push({}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing hashPasswords


	it('should be possible to set encrypted password', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				security: {
					encryptionKey: 'MySecretKey'
				}
			}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			var encrypted = crypto('secret' + settings.security.encryptionKey).toString();
			settings.general.myPassword.should.equals(encrypted);
			callback(null);
		});

		settings.push({ 
			general: {
				myPassword: 'secret'
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should be possible to set encrypted password without salt', function(done) {

		// Prevent push event during test
		sandbox.stub(settings, 'emit').withArgs('settings.push');

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			var settings = JSON.parse(data);
			var encrypted = crypto('secret').toString();
			settings.general.myPassword.should.equals(encrypted);
			callback(null);
		});

		settings.push({ 
			general: {
				myPassword: 'secret'
			}
		}, function(err) {
			should.not.exist(err);
			done();
		});

	});

});
