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
		yield browser.url(sandbox.baseUrl);
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.title);

	});

	it('should have the header title based on user settings', function *() {

		var header = yield browser.getText('#hp header h1')
		header.should.be.equal(sandbox.title);

	});

	it('should have the header subtitle based on user settings', function *() {

		var subtitle = yield browser.getText('#hp header h2')
		subtitle.should.be.equal(sandbox.subtitle);

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
		action.should.be.equal(sandbox.baseUrl + '/download');

		var submit = yield browser.isExisting('.download form button[type=submit]');
		submit.should.be.equal(true);

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
});