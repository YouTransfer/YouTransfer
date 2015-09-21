// Unit test for MODULE_NAME component
// Mocha and Chai are always included
'use strict';

var $ = require('jquery');
var sinon = require('sinon');
var templateEditor = require('./templateEditor');

describe('TemplateEditor component', function() {

	var sandbox;

	beforeEach(function() {
		$('body').empty();
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});


	it('should try to retrieve the url using JQuery XHR and replace target content with result', function() {

		sandbox.stub($, 'get', function (url) {
			should.exist(url);
			url.should.equals('http://someurl/');

			var d = $.Deferred();
			d.resolve('content');
			return d.promise();
		});

		var fixture = getFixture();
		var instance = new templateEditor(fixture);
		$(fixture).html().should.equals('content');
		$.get.calledOnce.should.equals(true);
		
	});

});

function getFixture() {
	var fixture = document.createElement('textarea');
	fixture.setAttribute('data-template', 'http://someurl/');
	return fixture;
}