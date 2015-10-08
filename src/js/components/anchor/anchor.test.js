'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var sinon = require('sinon');
var anchor = require('./anchor');

// ------------------------------------------------------------------------------------------ Test Definition

describe('Anchor component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	var sandbox;

	beforeEach(function() {
		$('body').empty();
		sandbox = sinon.sandbox.create();
		$(document).off('xhr.loaded.anchor');
		$(document).off('component.anchor.success');
	});

	afterEach(function() {
		sandbox.restore();
		$('body').empty();
		$(document).off('xhr.loaded.anchor');
		$(document).off('component.anchor.success');
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should try to retrieve the url using JQuery XHR and replace target with result (same id)', function(done) {

		var fixture = getFixture();
		new anchor(fixture);

		sandbox.stub($, 'get', function (url) {
			should.exist(url);
			url.should.equals('http://someurl/');

			var d = $.Deferred();
			d.resolve({
				output: '<div id="target">content</div>'
			});
			return d.promise();
		});

		$(document).on('xhr.loaded.anchor', function(event, element, $target) {
			should.exist(element);
			element.should.equals(fixture);
			$target.attr('id').should.equals('target');
			$target.html().should.equals('content');
			$.get.calledOnce.should.equals(true);
		});

		$(document).on('component.anchor.success', function() {
			done();
		});

		$(fixture).click();
	});

	it('should try to retrieve the url using JQuery XHR and replace target with result (different id)', function(done) {

		var fixture = getFixture();
		new anchor(fixture);

		sandbox.stub($, 'get', function (url) {
			should.exist(url);
			url.should.equals('http://someurl/');

			var d = $.Deferred();
			d.resolve({
				output: '<div id="anotherTarget">content</div>'
			});
			return d.promise();
		});

		$(document).on('xhr.loaded.anchor', function(event, element, $target) {
			should.exist(element);
			element.should.equals(fixture);
			$target.attr('id').should.equals('anotherTarget');
			$target.html().should.equals('content');
			$.get.calledOnce.should.equals(true);
		});

		$(document).on('component.anchor.success', function() {
			done();
		});

		$(fixture).click();
	});
});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture() {
	var fixture = document.createElement('a');
	fixture.setAttribute('href', 'http://someurl/');
	fixture.setAttribute('data-target', 'target');

	var target = document.createElement('div');
	target.id = 'target';
	document.body.appendChild(target);

	return fixture;
}
