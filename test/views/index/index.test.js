'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var fs = require('fs');
var path = require('path');
var should = require('chai').should();
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: path.join(__dirname, '../../../local.json') })
	 .file({ file: path.join(__dirname, '../../../config.json') });
var settings = require('../../../lib/settings');

describe('Index View', function() {

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
		yield browser.url(sandbox.general.baseUrl);
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the header title based on user settings', function *() {

		var header = yield browser.getText('#hp header h1')
		header.should.be.equal(sandbox.general.title);

	});

	it('should have the header subtitle based on user settings', function *() {

		var subtitle = yield browser.getText('#hp header h2')
		subtitle.should.be.equal(sandbox.general.subtitle);

	});

	it('should have a link to the home page', function *() {

		var link = yield browser.isExisting('#hp header a[href="/"]');
		link.should.be.equal(true);

		var linkText = yield browser.getText('#hp header a[href="/"]');
		linkText.should.be.equal(sandbox.general.title);

	});

	it('should have a link to the settings page', function *() {

		var link = yield browser.isExisting('ul.nav > li > a');
		link.should.be.equal(true);

		var linkText = yield browser.getText('ul.nav > li > a')
		linkText.should.be.equal('Settings');

	});

	it('should have a form to enable downloading a file', function *() {

		var form = yield browser.isExisting('.download form');
		form.should.be.equal(true);

		var action = yield browser.getAttribute('.download form', 'action');
		should.exist(action);
		action.should.be.equal(sandbox.general.baseUrl + '/download');

		var submit = yield browser.isExisting('.download form button[type=submit]');
		submit.should.be.equal(true);

	});

	it('should not have a form to enable downloading a file if this feature is disabled', function *() {

		var currentValue = sandbox.general.enableDownload;
		if(currentValue) {
			var enableDownload = yield browser.click('ul.nav > li > a')
											  .click('input#enableDownload')
											  .submitForm('.tab-pane.active form')
											  .waitForExist('.tab-pane.active .alert strong', 5000)
											  .isExisting('input#enableDownload:checked');
			enableDownload.should.be.equal(false);
		}

		var download = yield browser.url('/')
									.isExisting('.download');
		download.should.be.equal(false);

		var form = yield browser.url('/')
								.isExisting('.download form');
		form.should.be.equal(false);

		var submit = yield browser.url('/')
								  .isExisting('.download form button[type=submit]');
		submit.should.be.equal(false);

		if(currentValue) {
			var enableDownload = yield browser.click('ul.nav > li > a')
											  .click('input#enableDownload')
											  .submitForm('.tab-pane.active form')
											  .waitForExist('.tab-pane.active .alert strong', 5000)
											  .isExisting('input#enableDownload:checked');
			enableDownload.should.be.equal(true);
		}

	});

	it('should have a form to enable downloading a file which throws an error when trying to exploit path traversal', function *() {

		var form = yield browser.isExisting('.download form');
		form.should.be.equal(true);

		var action = yield browser.getAttribute('.download form', 'action');
		should.exist(action);
		action.should.be.equal(sandbox.general.baseUrl + '/download');

		var submit = yield browser.isExisting('.download form button[type=submit]');
		submit.should.be.equal(true);

		var error = yield browser.setValue('input[name="token"]', '../config')
								 .submitForm('.download form button[type=submit]')
								 .waitForExist('.download form span.help-block span.text-danger')
								 .getText('.download form span.help-block span.text-danger');
		error.should.equals('Oh my... something went terribly wrong!');

	});

	it('should have a dropzone', function *() {

		var dropzone = yield browser.isExisting('.dz-action-add.dz-clickable.dropzone');
		dropzone.should.be.equal(true);

		var previewTemplate = yield browser.isExisting('.dropzone .dz-preview-template');
		previewTemplate.should.be.equal(true);

		var message = yield browser.isExisting('.dropzone .dz-default.dz-message');
		message.should.be.equal(true);

	});

	it('should have a fallback to dropzone', function *() {

		var currentValue = sandbox.dropzone.fallback;

		var fallback = yield browser.click('ul.nav > li > a')
									.click('a[href="/settings/transfer"]')
									.click('input#forceFallback')
									.submitForm('.tab-pane.active form')
									.url('/')
									.isExisting('.fallback');
		fallback.should.be.equal(true);

		if(!currentValue) {
			fallback = yield browser.click('ul.nav > li > a')
									.click('a[href="/settings/transfer"]')
									.click('input#forceFallback')
									.submitForm('.tab-pane.active form')
									.url('/')
									.isExisting('.fallback');
			fallback.should.be.equal(false);
		}

	});

	it('should be possible to upload file and retrieve token', function *() {

		var currentValue = sandbox.dropzone.fallback;

		var fallback = yield browser.click('ul.nav > li > a')
									.click('a[href="/settings/transfer"]')
									.click('input#forceFallback')
									.submitForm('.tab-pane.active form')
									.url('/')
									.isExisting('.fallback');
		fallback.should.be.equal(true);

		if(!sandbox.storage.location === 'local') {
			var alert = yield browser.click('ul.nav > li > a')
									 .click('a[href="/settings/storage"]')
									 .selectByVisibleText('select#StorageLocation', 'Local file system')
									 .submitForm('.tab-pane.active form')
									 .waitForExist('.tab-pane.active .alert strong', 5000)
									 .getText('.tab-pane.active .alert strong');
			alert.should.be.equal('Success!');
		}

		var preview = yield browser.url('/')
								   .waitForExist('input#payload')
								   .execute(function() {
								   		// The WebDriverIO chooseFile() method cannot target an invisible input
								   		// It also does not work well with multiple file input
										jQuery("input#payload").removeAttr('multiple')
															   .show();
								   })
								   .waitForVisible('input#payload')
								   .chooseFile('input#payload', path.join(__dirname, '../../../README.md'))
								   .submitForm('.fallback form')
								   .waitForExist('.dz-preview-template')
								   .getText('.dz-preview-template .dz-preview-description span[data-dz-name]')
		preview.should.be.equal('README.md');

		var token = yield browser.getText('.dz-preview-item .dz-preview-description .dz-preview-result .text-success a')
		should.exist(token);

		var tokenLink = yield browser.getAttribute('.dz-preview-item .dz-preview-description .dz-preview-result .text-success a', 'href')
		tokenLink.should.be.equal(sandbox.general.baseUrl + '/download/' + token + '/');

		var emailHeader = yield browser.getText('#hp .dz-completed-container .dz-upload-complete h2');
		should.exist(emailHeader);

		var emailForm = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form');
		emailForm.should.be.equal(true);

		var emailFrom = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form input#from');
		emailFrom.should.be.equal(true);

		var emailTo = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form input#to');
		emailTo.should.be.equal(true);

		var emailBody = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form textarea[name="email[body]"]');
		emailBody.should.be.equal(true);

		var submit = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form button[type="submit"]');
		submit.should.be.equal(true);

		if(!currentValue) {
			fallback = yield browser.click('ul.nav > li > a')
									.click('a[href="/settings/transfer"]')
									.click('input#forceFallback')
									.submitForm('.tab-pane.active form')
									.url('/')
									.isExisting('.fallback');
			fallback.should.be.equal(false);
		}

	});

	it('should be possible to upload encrypted file and retrieve token', function *() {

		var currentValue = sandbox.dropzone.fallback;

		if(!currentValue) {
			var fallback = yield browser.click('ul.nav > li > a')
										.click('a[href="/settings/transfer"]')
										.click('input#forceFallback')
										.submitForm('.tab-pane.active form')
										.url('/')
										.isExisting('.fallback');
			fallback.should.be.equal(true);
		}

		if(!sandbox.storage.location === 'local') {
			var alert = yield browser.url('/')
									 .click('ul.nav > li > a')
									 .click('a[href="/settings/storage"]')
									 .selectByVisibleText('select#StorageLocation', 'Local file system')
									 .submitForm('.tab-pane.active form')
									 .waitForExist('.tab-pane.active .alert strong', 5000)
									 .getText('.tab-pane.active .alert strong');
			alert.should.be.equal('Success!');
		}

		var encrypted = yield browser.url('/')
									 .click('ul.nav > li > a')
									 .click('a[href="/settings/security"]')
									 .click('input#encryptionEnabled')
									 .setValue('input#encryptionKey', 'MySecretEncryptionKey')
									 .submitForm('.tab-pane.active form')
									 .waitForExist('.tab-pane.active .alert strong', 5000)
									 .isExisting('input#encryptionEnabled:checked');
		encrypted.should.be.equal(true);

		var preview = yield browser.url('/')
								   .waitForExist('input#payload')
								   .execute(function() {
								   		// The WebDriverIO chooseFile() method cannot target an invisible input
								   		// It also does not work well with multiple file input
										jQuery("input#payload").removeAttr('multiple')
															   .show();
								   })
								   .waitForVisible('input#payload')
								   .chooseFile('input#payload', path.join(__dirname, '../../../README.md'))
								   .submitForm('.fallback form')
								   .waitForExist('.dz-preview-template')
								   .getText('.dz-preview-template .dz-preview-description span[data-dz-name]')
		preview.should.be.equal('README.md');

		var token = yield browser.getText('.dz-preview-item .dz-preview-description .dz-preview-result .text-success a')
		should.exist(token);

		var tokenLink = yield browser.getAttribute('.dz-preview-item .dz-preview-description .dz-preview-result .text-success a', 'href')
		tokenLink.should.be.equal(sandbox.general.baseUrl + '/download/' + token + '/');

		var emailHeader = yield browser.getText('#hp .dz-completed-container .dz-upload-complete h2');
		should.exist(emailHeader);

		var emailForm = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form');
		emailForm.should.be.equal(true);

		var emailFrom = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form input#from');
		emailFrom.should.be.equal(true);

		var emailTo = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form input#to');
		emailTo.should.be.equal(true);

		var emailBody = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form textarea[name="email[body]"]');
		emailBody.should.be.equal(true);

		var submit = yield browser.isExisting('#hp .dz-completed-container .dz-upload-complete form button[type="submit"]');
		submit.should.be.equal(true);

		if(!currentValue) {
			fallback = yield browser.click('ul.nav > li > a')
									.click('a[href="/settings/transfer"]')
									.click('input#forceFallback')
									.submitForm('.tab-pane.active form')
									.url('/')
									.isExisting('.fallback');
			fallback.should.be.equal(false);
		}

	});

});