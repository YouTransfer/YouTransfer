'use strict'

// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var logger = require('../../lib/logger')

// ------------------------------------------------------------------------------------------ Test Definition

describe('Logger module', function() {

	it('should be able to create a logger with a name', function() {

		var instance = logger('name');
		should.exist(instance);
		instance.fields.name.should.equals('name');

	});

	it('should be able to create a logger without a name', function() {

		var instance = logger();
		should.exist(instance);
		instance.fields.name.should.equals('youtransfer');

	});

});
