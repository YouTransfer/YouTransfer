// Unit test for MODULE_NAME component
// Mocha and Chai are always included
'use strict';

var alerts = require('./alerts');
var instance;

describe('Alerts component', function() {

	it('should remove the "hidden" class from the close button', function(done) {

		var fixture = getFixture();
		var instance = new alerts(fixture, { 
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
		var instance = new alerts(fixture, { 
			timeout: 500,
			callback: function() {
				fixture.getAttribute('style').should.equals('display: none; ');
				done();
			}
		});

	});

});

function getFixture() {
	var fixture = document.createElement('div');
	document.body.appendChild(fixture);

	fixture = document.getElementsByTagName('div')[0];
	var closeButton = document.createElement('button');
	closeButton.setAttribute('class', 'close hidden');
	fixture.appendChild(closeButton);

	return fixture;
}