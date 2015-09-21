// Unit test for MODULE_NAME component
// Mocha and Chai are always included
'use strict';

var $ = require('jquery');
var sinon = require('sinon');
var tabs = require('./tabs');

describe('Tabs component', function() {

	var sandbox;

	beforeEach(function() {
		$('body').empty();
		sandbox = sinon.sandbox.create();
		$(document).off('xhr.loaded.tabs');
	});

	afterEach(function() {
		sandbox.restore();
		$('body').empty();
		$(document).off('xhr.loaded.tabs');
	});

	it('should change the active tab after an XHR request triggered by a tablist link', function() {

		var fixture = getFixture();
		var instance = new tabs($('[role="tablist"]').get(0));

		$('li.active a').html().should.equals('first');
		$(document).trigger('xhr.loaded', fixture);
		$('li.active a').html().should.equals('second');
	});

});

function getFixture() {
	$('body').append('<ul role="tablist"><li class="active"><a href="first" role="tab">first</li><li><a href="second" role="tab">second</a></li></ul>');

	var fixture = document.createElement('a');
	fixture.setAttribute('role', 'tab');
	fixture.setAttribute('href', 'second');
	fixture.setAttribute('data-target', 'target');

	return fixture;
}