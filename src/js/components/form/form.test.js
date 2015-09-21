// Unit test for MODULE_NAME component
// Mocha and Chai are always included
'use strict';

var $ = require('jquery');
var sinon = require('sinon');
var form = require('./form');

describe('Form component', function() {

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

	it('should try to post to the url using JQuery XHR and replace target with result', function(done) {

		var fixture = getFixture();
		var instance = new form(fixture);

		sandbox.stub($, 'ajax', function (options) {
			options.success('My Awesome Response');
		});

		$(document).on('component.form.success', function() {
			$('#target').length.should.equals(1);
			$('#target').html().should.equals('My Awesome Response');
			done();
		})

		$(fixture).trigger('submit');

	});

});

function getFixture(value) {
	var fixture = document.createElement('form');
	fixture.setAttribute('data-xhrform-target', 'target');

	var target = document.createElement('div');
	target.id = 'target';
	document.body.appendChild(target);

	return fixture;
}