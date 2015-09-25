'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var baseurl = require('./baseurl');

// ------------------------------------------------------------------------------------------ Test Definition

describe('BaseUrl component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		$('body').empty();
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should not add warning to document.body if base URL matches window.location.href', function() {

		var fixture = getFixture(window.location.href);
		fixture.getAttribute('value').should.equals(window.location.href);

		var instance = new baseurl(fixture);
		$('.baseurl').length.should.equals(0);

	});

	it('should add warning to document.body if base URL does not match window.location.href', function() {

		var fixture = getFixture('http://someurl');
		var instance = new baseurl(fixture);

		$('.baseurl').html().should.equals("<strong>Warning</strong>: the base URL is set to someurl but you are accessing this page from localhost:9999. It is recommended to update the BaseUrl setting.");

	});

});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture(value) {
	var fixture = document.createElement('meta');
	fixture.setAttribute('name', 'baseurl');
	fixture.setAttribute('value', value);
	return fixture;
}