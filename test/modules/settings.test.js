
// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var settings = require('../../lib/settings');
var path = require('path');

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

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({}));
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			callback(null);
		});

		settings.push({ title: title }, function(err) {
			should.not.exist(err);
			done();
		});

	});

	it('should throw an error if it is not possible to read settings file', function(done) {
		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		settings.push({ title: title }, function(err) {
			should.exist(err);
			err.should.equals('error');
			done();
		});
	});

	it('should throw an error if it is not possible to write settings file', function(done) {
		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, 'this is not json and should produce an error');
		});

		settings.push({ title: title }, function(err) {
			should.exist(err);
			err.message.should.equals('Unexpected token h');
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing read

	it('should be possible to get title', function(done) {
		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				title: title,
				localstoragepath: path.join(__dirname, '/uploads/')
			}));
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			output.title.should.equal(title);
			done();
		});
	});

	it('should not be possible to get title if invalid JSON is returned', function(done) {

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

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		sandbox.stub(nconf, 'get').returns({ title: 'title' });

		settings.get(function(err, output) {
			should.not.exist(err);
			output.title.should.equals('title');
			done();
		});
	});

	it('should still be possible to get localstoragepath if settings file does not exist', function(done) {

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback('error', null);
		});

		sandbox.stub(nconf, 'get').returns({ title: 'title', localstoragepath: './somepath' });

		settings.get(function(err, output) {
			should.not.exist(err);
			output.localstoragepath.should.equals(path.join(__dirname, '../../somepath'));
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing localstoragepath

	it('should be possible to set relative localstoragepath', function(done) {

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				basedir: __dirname,
				localstoragepath: './uploads'
			}));
		});

		settings.get(function(err, output) {
			should.not.exist(err);
			done();
		});
	});

	it('should not be able to use invalid localstoragepath setting', function(done) {

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			callback(null, JSON.stringify({
				basedir: __dirname,
				localstoragepath: 100
			}));
		});

		settings.get(function(err, output) {
			should.exist(err);
			done();
		});
	});

});
