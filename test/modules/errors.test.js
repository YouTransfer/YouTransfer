'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var _ = require('lodash');
var sinon = require('sinon');
var should = require('chai').should();
var filesize = require('filesize');
var path = require('path');
var errors = require('../../lib/errors');

// ------------------------------------------------------------------------------------------ Mock Dependencies


// ------------------------------------------------------------------------------------------ Test Definition

describe('Errors module', function() {
	var sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	})

	// -------------------------------------------------------------------------------------- Testing register

	it('should be possible to register errors using an Array', function() {

		var req = {},
			array = [{
				code: 'MYERROR',
				message: 'My Error'
			}]

		errors(req, null, function() {});
		var result = req.errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an associative Array', function() {

		var req = {},
			array = [];

		array['MYERROR'] = {
			message: 'My Error'
		}

		errors(req, null, function() {});
		var result = req.errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Array of Errors', function() {

		var req = {};

		var error = new Error('My Error');
		error.code = 'MYERROR';
		var array = [ error ];

		errors(req, null, function() {});
		var result = req.errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Array of Objects', function() {

		var req = {};

		var array = [{
			code: 'MYERROR',
			message: 'My Error'
		}];

		errors(req, null, function() {});
		var result = req.errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an associative Array of Objects', function() {

		var req = {};

		var array = [];
		array['MYERROR'] = {
			message: 'My Error'
		};

		errors(req, null, function() {});
		var result = req.errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Error', function() {

		var req = {};
		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var result = req.errors.register(error);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Object', function() {

		var req = {}

		errors(req, null, function() {});
		var result = req.errors.register({
			code: 'MYERROR',
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register errors using an Object and a separate argument for the error code', function() {

		var req = {};

		errors(req, null, function() {});
		var result = req.errors.register({
			message: 'My Error'
		}, 'MYERROR');

		result.should.equals(true);

	});

	it('should be possible to register errors using an Error and a separate argument for the error code', function() {

		var req = {},
			error = new Error('My Error');

		errors(req, null, function() {});
		var result = req.errors.register(error, 'MYERROR');
		result.should.equals(true);

	});

	it('should be possible to register errors using a separate argument for the error code, but providing the code in the error Object', function() {

		var req = {};

		errors(req, null, function() {});
		var result = req.errors.register({
			code: 'MYERROR',
			message: 'My Error'
		}, null);

		result.should.equals(true);

	});

	it('should be possible to register default error using an Array', function() {

		var req = {};

		errors(req, null, function() {});
		var result = req.errors.register([{
			message: 'My Error'
		}]);

		result.should.equals(true);

	});

	it('should be possible to register default error using an Object', function() {

		var req = {};

		errors(req, null, function() {});
		var result = req.errors.register({
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register default error using an Error', function() {

		var req = {},
			error = new Error('My Error');

		errors(req, null, function() {});
		var result = req.errors.register(error);
		result.should.equals(true);

	});

	it('should be possible to register default error using a separate argument for the error code', function() {

		var req = {};

		errors(req, null, function() {});
		var result = req.errors.register({
			message: 'My Error'
		}, null);

		result.should.equals(true);

	});

	it('should not be possible to register errors using an Array of strings', function() {

		var req = {};

		try {
			errors(req, null, function() {});
			var result = req.errors.register(["Error1", "Error2", "Error3"]);
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using a String', function() {

		var req = {};

		try {
			errors(req, null, function() {});
			var result = req.errors.register("My Error");
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using an invalid type for the error and a separate argument for the error code', function() {

		var req = {};

		try {
			errors(req, null, function() {});
			var result = req.errors.register("My Error",100);
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using more than two arguments', function() {

		var req ={};

		try {
			errors(req, null, function() {});
			var result = req.errors.register("My Error","is","awesome");
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	// -------------------------------------------------------------------------------------- Testing parse & get

	it('should be possible to retrieve registered error message from system error', function() {

		var req = {};

		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var registered = req.errors.register(error);
		registered.should.equals(true);

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = req.errors.parse(otherError);
		parsed.should.equals(true);
		req.errors.exist().should.equals(true);

		var result = req.errors.get();
		result.length.should.equals(1);
		result[0].should.equals(error);
	});
	
	it('should return the default error message if there was no matching error registered', function() {

		var req = {};

		var defaultError = new Error('default');
		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var registered = req.errors.register([ error, defaultError ]);
		registered.should.equals(true);

		delete error.code
		var parsed = req.errors.parse(error);
		parsed.should.equals(true);
		req.errors.exist().should.equals(true);

		var result = req.errors.get();
		result.length.should.equals(1);
		result[0].should.equals(defaultError);

	});

	it('should return the original error object if there was no matching error nor any default error registered', function() {

		var req = {};

		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var registered = req.errors.register(error);
		registered.should.equals(true);

		error.code = 'MYOTHERERROR'
		var parsed = req.errors.parse(error);
		parsed.should.equals(true);
		req.errors.exist().should.equals(true);

		var result = req.errors.get();
		result.length.should.equals(1);
		result[0].should.equals(error);

	});

	it('should be possible to parse an error with null value', function() {

		var req = {};

		errors(req, null, function() {});
		var parsed = req.errors.parse(null);
		parsed.should.equals(true);
		req.errors.exist().should.equals(false);

	});

	// -------------------------------------------------------------------------------------- Testing purge & reset

	it('should be possible to purge all registered errors', function() {

		var req = {};

		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var registered = req.errors.register(error);
		registered.should.equals(true);

		req.errors.purge();

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = req.errors.parse(otherError);
		parsed.should.equals(true);
		req.errors.exist().should.equals(true);

		var result = req.errors.get();
		result.length.should.equals(1);
		result[0].should.equals(otherError);

	});

	it('should be possible to reset all registered and parsed errors', function() {

		var req = {};

		var error = new Error('My Error');
		error.code = 'MYERROR';

		errors(req, null, function() {});
		var registered = req.errors.register(error);
		registered.should.equals(true);

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = req.errors.parse(otherError);
		parsed.should.equals(true);
		req.errors.exist().should.equals(true);

		req.errors.reset();
		var result = req.errors.get();
		result.length.should.equals(0);

	});

	// -------------------------------------------------------------------------------------- Testing custom errors

	it('should be possible to create a custom error', function(done) {

		var req = {};

		errors(req, null, function() {

			should.exist(req.errors);
			var error = req.errors.custom('code', 'message');
			should.exist(error);
			error.code.should.equals('code');
			error.message.should.equals('message');
			done();

		});

	});

});


