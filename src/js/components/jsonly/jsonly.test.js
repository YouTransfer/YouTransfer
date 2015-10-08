'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var jsonly = require('./jsonly');

// ------------------------------------------------------------------------------------------ Test Definition

describe('JSOnly component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		$('body').empty();
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should remove the jsonly attribute from the element', function() {

		var fixture = getFixture();
		should.exist($(fixture).attr('data-js-only'));
		$(fixture).attr('data-js-only').should.equals('true');

		var instance = new jsonly(fixture);
		should.not.exist($(fixture).attr('data-js-only'));

	});

});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture() {
	var fixture = document.createElement('div');
	fixture.setAttribute('data-js-only', 'true');
	return fixture;
}
