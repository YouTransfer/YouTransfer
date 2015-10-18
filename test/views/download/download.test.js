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

describe('Download View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/download');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the header title based on user settings', function *() {

		var header = yield browser.getText('#dl header h1')
		header.should.be.equal(sandbox.general.title);

	});

	it('should have the header subtitle based on user settings', function *() {

		var subtitle = yield browser.getText('#dl header h2')
		subtitle.should.be.equal(sandbox.general.subtitle);

	});

	it('should have a form to enable downloading a file', function *() {

		var form = yield browser.isExisting('#dl .download form');
		form.should.be.equal(true);

		var action = yield browser.getAttribute('#dl .download form', 'action');
		should.exist(action);
		action.should.be.equal(sandbox.general.baseUrl + '/download');

		var submit = yield browser.isExisting('#dl .download form button[type=submit]');
		submit.should.be.equal(true);

	});

	it('should have a link to the home page', function *() {

		var link = yield browser.isExisting('#dl > div > a[href="/"]');
		link.should.be.equal(true);

		var linkText = yield browser.getText('#dl > div > a[href="/"]');
		linkText.should.be.equal('or return to homepage');

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

		var form = yield browser.url(sandbox.general.baseUrl + '/download')
								.isExisting('.download form');
		form.should.be.equal(false);

		var submit = yield browser.url(sandbox.general.baseUrl + '/download')
								  .isExisting('.download form button[type=submit]');
		submit.should.be.equal(false);

		var error = yield browser.url(sandbox.general.baseUrl + '/download')
								 .getText('.text-danger');
		error.should.equals("Err... this is awkward...\nFile download by token has been disabled.\nDidn\'t you get the memo?");

		if(currentValue) {
			var enableDownload = yield browser.click('ul.nav > li > a')
											  .click('input#enableDownload')
											  .submitForm('.tab-pane.active form')
											  .waitForExist('.tab-pane.active .alert strong', 5000)
											  .isExisting('input#enableDownload:checked');
			enableDownload.should.be.equal(true);
		}

	});
});