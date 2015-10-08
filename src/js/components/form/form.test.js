'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var $ = require('jquery');
var sinon = require('sinon');
var form = require('./form');

// ------------------------------------------------------------------------------------------ Test Definition

describe('Form component', function() {

	// -------------------------------------------------------------------------------------- Test Initialization

	var sandbox;

	beforeEach(function() {
		$('body').empty();
		sandbox = sinon.sandbox.create();
		$(document).off('component.form.success');
	});

	afterEach(function() {
		sandbox.restore();
		$(document).off('component.form.success');
	});

	// -------------------------------------------------------------------------------------- Test features

	it('should try to post to the url using JQuery XHR and replace target with result', function(done) {

		var fixture = getFixture();
		new form(fixture);

		sandbox.stub($, 'ajax', function (options) {
			options.success({
				output: '<div id="target">My Awesome Response</div>'
			});
		});

		$(document).on('component.form.success', function() {
			$('#target').length.should.equals(1);
			$('#target').html().should.equals('My Awesome Response');
			done();
		});

		$(fixture).trigger('submit');

	});

	it('should try to post to the url using JQuery XHR and replace target with result (different id)', function(done) {

		var fixture = getFixture();
		new form(fixture);

		sandbox.stub($, 'ajax', function (options) {
			options.success({
				output: '<div id="anotherTarget">My Awesome Response</div>'
			});
		});

		$(document).on('component.form.success', function() {
			$('#anotherTarget').length.should.equals(1);
			$('#anotherTarget').html().should.equals('My Awesome Response');
			done();
		});

		$(fixture).trigger('submit');

	});


});

// ------------------------------------------------------------------------------------------ Test fixture

function getFixture() {
	var fixture = document.createElement('form');
	fixture.setAttribute('data-xhrform-target', 'target');

	var target = document.createElement('div');
	target.id = 'target';
	document.body.appendChild(target);

	return fixture;
}
