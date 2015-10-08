'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var sinon = require('sinon');
var templateEditor = require('./templateEditor');

// ------------------------------------------------------------------------------------------ Test Definition

describe('TemplateEditor component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	var sandbox;

	beforeEach(function() {
		$('body').empty();
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should try to retrieve the url using JQuery XHR and replace target content with result', function() {

		sandbox.stub($, 'get', function (url) {
			should.exist(url);
			url.should.equals('http://someurl/');

			var d = $.Deferred();
			d.resolve('content');
			return d.promise();
		});

		var fixture = getFixture();
		new templateEditor(fixture);
		$(fixture).html().should.equals('content');
		$.get.calledOnce.should.equals(true);

	});

});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture() {
	var fixture = document.createElement('textarea');
	fixture.setAttribute('data-template', 'http://someurl/');
	return fixture;
}
