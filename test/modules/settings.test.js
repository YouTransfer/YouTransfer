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

	// -------------------------------------------------------------------------------------- Testing defaults

	it('should be possible to get defaults from cache', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null, {
				key: 'value'
			});
		});

		settings.defaults(function(err, output) {
			should.not.exist(err);
			output.key.should.equal('value');
			done();
		});
	});

	it('should be possible to get defaults from file system', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				key: 'value'
			}));
		});

		settings.defaults(function(err, output) {
			should.not.exist(err);
			output.key.should.equal('value');
			done();
		});
	});

	it('should not be possible to get defaults if invalid JSON is returned', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, 'this is not JSON');
		});

		settings.defaults(function(err, output) {
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

		settings.defaults(function(err, output) {
			should.not.exist(err);
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing get

	it('should be possible to get title from cache', function(done) {

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

	it('should be possible to get title from file system', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {});
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

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {});
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

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {
				general: {
					title: 'title' 
				},
				storage: {
					localstoragepath: path.join(__dirname, '/uploads/')
				}
			});
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
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

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, { 
				general: {
					title: 'title'
				},
				storage: {
					localstoragepath: './somepath' 
				}
			});
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.storage.localstoragepath.should.equals(path.join(__dirname, '../../somepath'));
			done();
		});
	});

	it('should be possible to set relative localstoragepath', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {});
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

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {});
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

	it('should still be possible to use encryptionKey from environment variables', function(done) {

		sandbox.stub(nconf, 'get', function (name) {
			if(name === 'ENCRYPTIONKEY') {
				return 'MySecretKey';
			} else {
				return null;
			}
		});

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(settings, 'defaults', function (callback) {
			callback(null, {
				general: {
					title: 'title' 
				},
				storage: {
					localstoragepath: path.join(__dirname, '/uploads/')
				}
			});
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.general.title.should.equals('title');
			output.security.encryptionKey.should.equals('MySecretKey');
			output.security.encryptionKeyMethod.should.equals('env');
			done();
		});
	});
	// -------------------------------------------------------------------------------------- Testing push

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

	it('should throw an error if it the settings are finalised', function(done) {

		sandbox.stub(settings.cache, 'get', function (name, callback) {
			callback(null);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				state: {
					finalised: true
				}
			}));
		});

		settings.push({ 
			general: {
				title: 'title'
			}
		}, function(err) {
			should.exist(err);
			err.message.should.equals('SETTINGS_FINALISED');
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

	// -------------------------------------------------------------------------------------- Testing finalise

	it('should be possible to finalise settings', function(done) {
		var code = 'MySecretCode';

		sandbox.stub(settings, 'push', function (settings, callback) {
			should.exist(settings);
			settings.state.finalised.should.equals(true);
			settings.state.unlockCode.should.equals(code);
			done();
		});

		settings.finalise(code);
	});		

	// -------------------------------------------------------------------------------------- Testing unlock

	it('should be possible to unlock settings', function(done) {
		var code = 'MySecretCode';

		sandbox.stub(settings, 'get', function (callback) {
			callback(null, {
				state: {
					finalised: true,
					unlockCode: code
				}
			});
		});

		sandbox.stub(settings, 'push', function (settings, callback) {
			should.exist(settings);
			should.not.exist(settings.state.unlockCode)
			settings.state.finalised.should.equals(false);
			callback();
		});

		settings.unlock(code, function(err) {
			should.not.exist(err);
			done();
		});
	});		

	it('should continue with erronous callback if an invalid code was provided', function(done) {
		var code = 'MySecretCode';

		sandbox.stub(settings, 'get', function (callback) {
			callback(null, {
				state: {
					unlockCode: 'MyActualSecretCode'
				}
			});
		});

		settings.unlock(code, function(err) {
			should.exist(err);
			err.message.should.equals('INVALID_CODE');
			done();
		});
	});		

	it('should continue with erronous callback if an error occurs while unlocking the settings', function(done) {
		var code = 'MySecretCode';

		sandbox.stub(settings, 'get', function (callback) {
			callback(new Error('error'));
		});

		settings.unlock(code, function(err) {
			should.exist(err);
			err.message.should.equals('error');
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
