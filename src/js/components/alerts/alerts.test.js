'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var alerts = require('./alerts');

// ------------------------------------------------------------------------------------------ Test Definition

describe('Alerts component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		$('body').empty();
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should remove the "hidden" class from the close button', function(done) {

		var fixture = getFixture();
		new alerts(fixture, {
			timeout: 500,
			callback: function() {
				var closeButton = document.getElementsByClassName('close')[0];
				closeButton.getAttribute('class').should.equals('close');
				done();
			}
		});

	});

	it('should fade out after a period of time', function(done) {

		var fixture = getFixture();
		new alerts(fixture, {
			timeout: 500,
			callback: function() {
				fixture.getAttribute('style').should.equals('display: none; ');
				done();
			}
		});

	});

});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture() {
	var fixture = document.createElement('div');
	document.body.appendChild(fixture);

	fixture = document.getElementsByTagName('div')[0];
	var closeButton = document.createElement('button');
	closeButton.setAttribute('class', 'close hidden');
	fixture.appendChild(closeButton);

	return fixture;
}
