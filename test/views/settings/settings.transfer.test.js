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

describe('Transfer Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/settings/transfer');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('Transfer');

	});

	it('should have a "Max. file size (MB)" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('input#maxFilesize')
		value.should.be.equal(sandbox.dropzone.maxFilesize);

	});

	it('should have a "Accepted files" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('input#acceptedFiles')
		value.should.be.equal(sandbox.dropzone.acceptedFiles || '');

	});

	it('should have a "Parallel uploads" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('input#parallelUploads')
		value.should.be.equal(sandbox.dropzone.parallelUploads.toString());

	});

	it('should have a "Simplified interface " field with the current value based on user settings', function *() {

		var value = yield browser.getAttribute('input#forceFallback', 'checked')
		if(sandbox.dropzone.forceFallback) {
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

		var currentValue = sandbox.dropzone.maxFilesize;
		var newValue = currentValue + '2';

		alert = yield browser.setValue('input#maxFilesize', newValue)
							 .submitForm('.tab-pane.active form')
							 .waitForExist('.tab-pane.active .alert strong', 5000)
							 .getText('.tab-pane.active .alert strong');
		alert.should.be.equal('Success!');

		var title = yield browser.getValue('input#maxFilesize');
		title.should.be.equal(newValue);

		alert = yield browser.setValue('input#maxFilesize', currentValue)
							 .submitForm('.tab-pane.active form')
							 .waitForExist('.tab-pane.active .alert strong', 5000)
							 .getText('.tab-pane.active .alert strong');
		alert.should.be.equal('Success!');

		var value = yield browser.getValue('input#maxFilesize');
		value.should.be.equal(currentValue);

	});


});