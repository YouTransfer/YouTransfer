// Unit test for MODULE_NAME component
// Mocha and Chai are always included
'use strict';

var $ = require('jquery');
var jsonly = require('./jsonly');

describe('JSOnly component', function() {

	it('should remove the jsonly attribute from the element', function() {

		var fixture = getFixture();
		should.exist($(fixture).attr('data-js-only'));
		$(fixture).attr('data-js-only').should.equals('true');

		var instance = new jsonly(fixture);
		should.not.exist($(fixture).attr('data-js-only'));

	});

});

function getFixture(value) {
	var fixture = document.createElement('div');
	fixture.setAttribute('data-js-only', 'true');
	return fixture;
}