'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var path = require('path');
var should = require('chai').should();
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: path.join(__dirname, '../../../local.json') })
	 .file({ file: path.join(__dirname, '../../../config.json') });
var settings = require('../../../lib/settings');

describe('Template Settings View', function() {

	var sandbox;

	before(function (done) {
		settings.get(function(err, settings) {
			should.exist(settings);
			should.not.exist(err);
			sandbox = settings;
			done();
		});
	});

	beforeEach(function *() {
		yield browser.url(sandbox.general.baseUrl + '/settings/template');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('Templates');

	});

	it('should have a "Select template" field with the value always set to the initial option', function *() {

		var value = yield browser.getValue('select#template');
		value.should.be.equal('Select template');

	});

	it('should not be able to save the settings without selecting a template', function *() {

		var submit = yield browser.isVisible('button[type="submit"]');
		submit.should.be.equal(false);

	});

	it('should be able to save the settings', function *() {

		var alert = yield browser.isExisting('.tab-pane.active .alert strong');
		alert.should.be.equal(false);

		var currentValue = yield browser.selectByVisibleText('select#template', 'Email template')
										.waitForVisible('div#email')
										.getValue('div#email textarea');
		
		var alert = yield browser.submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active .alert strong', 5000)
								 .getText('.tab-pane.active .alert strong');
		alert.should.be.equal('Success!');

		var value = yield browser.selectByVisibleText('select#template', 'Email template')
								 .waitForVisible('div#email')
								 .getValue('div#email textarea');
		value.should.be.equal(currentValue);
	});
});