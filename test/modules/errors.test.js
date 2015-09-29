// ------------------------------------------------------------------------------------------ Test Dependencies

var _ = require('lodash');
var sinon = require('sinon');
var should = require('chai').should();
var filesize = require("filesize");
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
		errors.purge();
		sandbox.restore();
	})

	// -------------------------------------------------------------------------------------- Testing register

	it('should be possible to register errors using an Array', function() {

		var array = [{
			code: 'MYERROR',
			message: 'My Error'
		}]

		var result = errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an associative Array', function() {

		var array = [];
		array['MYERROR'] = {
			message: 'My Error'
		}

		var result = errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Array of Errors', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var array = [ error ];
		var result = errors.register(array);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Error', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var result = errors.register(error);
		result.should.equals(true);

	});

	it('should be possible to register errors using an Object', function() {

		var result = errors.register({
			code: 'MYERROR',
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register errors using an Object and a separate argument for the error code', function() {

		var result = errors.register('MYERROR', {
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register errors using an Error and a separate argument for the error code', function() {

		var error = new Error('My Error');
		var result = errors.register('MYERROR', error);
		result.should.equals(true);

	});

	it('should be possible to register errors using a separate argument for the error code, but providing the code in the error Object', function() {

		var result = errors.register(null, {
			code: 'MYERROR',
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register default error using an Array', function() {

		var result = errors.register([{
			message: 'My Error'
		}]);

		result.should.equals(true);

	});

	it('should be possible to register default error using an Object', function() {

		var result = errors.register({
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should be possible to register default error using an Error', function() {

		var error = new Error('My Error');
		var result = errors.register(error);
		result.should.equals(true);

	});

	it('should be possible to register default error using a separate argument for the error code', function() {

		var result = errors.register(null, {
			message: 'My Error'
		});

		result.should.equals(true);

	});

	it('should not be possible to register errors using an Array of strings', function() {

		try {
			var result = errors.register(["Error1", "Error2", "Error3"]);
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using a String', function() {

		try {
			var result = errors.register("My Error");
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using an invalid type for the error and a separate argument for the error code', function() {

		try {
			var result = errors.register("My Error",100);
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	it('should not be possible to register errors using more than two arguments', function() {

		try {
			var result = errors.register("My Error","is","awesome");
			result.should.equals(false);
		} catch(err) {
			should.exist(err);
			err.message.should.equals("Invalid argument exception");
		}

	});

	// -------------------------------------------------------------------------------------- Testing parse & get

	it('should be possible to retrieve registered error message from system error', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var registered = errors.register(error);
		registered.should.equals(true);

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = errors.parse(otherError);
		parsed.should.equals(true);
		errors.exist().should.equals(true);

		var result = errors.get();
		result.length.should.equals(1);
		result[0].should.equals(error);

	});

	it('should return the default error message if there was no matching error registered', function() {

		var defaultError = new Error('default');
		var error = new Error('My Error');
		error.code = 'MYERROR';

		var registered = errors.register([ error, defaultError ]);
		registered.should.equals(true);

		delete error.code
		var parsed = errors.parse(error);
		parsed.should.equals(true);
		errors.exist().should.equals(true);

		var result = errors.get();
		result.length.should.equals(1);
		result[0].should.equals(defaultError);

	});

	it('should return the original error object if there was no matching error nor any default error registered', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var registered = errors.register(error);
		registered.should.equals(true);

		error.code = 'MYOTHERERROR'
		var parsed = errors.parse(error);
		parsed.should.equals(true);
		errors.exist().should.equals(true);

		var result = errors.get();
		result.length.should.equals(1);
		result[0].should.equals(error);

	});

	// -------------------------------------------------------------------------------------- Testing purge & reset

	it('should be possible to purge all registered errors', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var registered = errors.register(error);
		registered.should.equals(true);

		errors.purge();

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = errors.parse(otherError);
		parsed.should.equals(true);
		errors.exist().should.equals(true);

		var result = errors.get();
		result.length.should.equals(1);
		result[0].should.equals(otherError);

	});

	it('should be possible to reset all registered and parsed errors', function() {

		var error = new Error('My Error');
		error.code = 'MYERROR';

		var registered = errors.register(error);
		registered.should.equals(true);

		var otherError = new Error('My Other Error');
		otherError.code = 'MYERROR';

		var parsed = errors.parse(otherError);
		parsed.should.equals(true);
		errors.exist().should.equals(true);

		errors.reset();
		var result = errors.get();
		result.length.should.equals(0);

	});

});


