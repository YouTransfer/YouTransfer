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

describe('General Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/settings/general');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('General');

	});

	it('should have a "Title" field with the current title based on user settings', function *() {

		var value = yield browser.getValue('input#title')
		value.should.be.equal(sandbox.general.title);

	});

	it('should have a "Tagline" field with the current subtitle based on user settings', function *() {

		var value = yield browser.getValue('input#subtitle')
		value.should.be.equal(sandbox.general.subtitle);

	});

	it('should have a "Base URL" field with the current base URL based on user settings', function *() {

		var value = yield browser.getValue('input#baseUrl')
		value.should.be.equal(sandbox.general.baseUrl);

	});

	it('should have a "Cleanup Schedule" field with the current cleanup schedule based on user settings', function *() {

		var value = yield browser.getValue('input#cleanupSchedule')
		value.should.be.equal(sandbox.general.cleanupSchedule);

	});

	it('should have a "Enable scheduled cleanup of files" field with the current value based on user settings', function *() {

		var value = yield browser.getAttribute('input#schedulerEnabled', 'checked')
		if(sandbox.general.schedulerEnabled) {
			should.exist(value);
		} else {
			should.not.exist(value);
		}

	});

	it('should have a "Enable file download feature" field with the current value based on user settings', function *() {

		var value = yield browser.waitForExist('input#enableDownload')
								 .getAttribute('input#enableDownload', 'checked')

		if(sandbox.general.enableDownload) {
			should.exist(value);
		} else {
			should.not.exist(value);
		}

	});

	it('should be able to save the settings', function *() {

		var alert = yield browser.isExisting('.tab-pane.active .alert strong');
		alert.should.be.equal(false);

		var value = yield browser.submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active .alert strong', 5000)
								 .getText('.tab-pane.active .alert strong');
		value.should.be.equal('Success!');

	});

	it('should be able to alter and save the settings', function *() {

		var alert = yield browser.isExisting('.tab-pane.active .alert strong');
		alert.should.be.equal(false);

		var currentValue = sandbox.general.title;
		var newValue = currentValue + '2';

		var value = yield browser.setValue('input#title', newValue)
								 .submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active .alert strong', 5000)
								 .getText('.tab-pane.active .alert strong');
		value.should.be.equal('Success!');

		var title = yield browser.getValue('input#title');
		title.should.be.equal(newValue);

		value = yield browser.setValue('input#title', currentValue)
							 .submitForm('.tab-pane.active form')
							 .waitForExist('.tab-pane.active .alert strong', 5000)
							 .getText('.tab-pane.active .alert strong');
		value.should.be.equal('Success!');

		var value = yield browser.getValue('input#title');
		value.should.be.equal(currentValue);

	});


});