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

describe('Unlock Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/unlock');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the header title based on user settings', function *() {

		var header = yield browser.getText('#unlock header h1')
		header.should.be.equal(sandbox.general.title);

	});

	it('should have the header subtitle based on user settings', function *() {

		var subtitle = yield browser.getText('#unlock header h2')
		subtitle.should.be.equal(sandbox.general.subtitle);

	});

	it('should have a password field to enter the unlock code', function *() {

		var value = yield browser.isExisting('input#unlockCode[type="password"]')
		value.should.be.equal(true);

	});

	it('should have a submit button to unlock the settings', function *() {

		var value = yield browser.isExisting('#unlock form button[type="submit"]')
		value.should.be.equal(true);

	});

	it('should be able to unlock finalised settings', function *() {

		var unlockCode = sandbox.state.unlockCode || 'unlock';

		var link = yield browser.url(sandbox.general.baseUrl + '/settings/finalise')
								.setValue('input#unlockCode', unlockCode)
								.submitForm('.tab-pane.active form')
								.isExisting('ul.nav > li > a');
		link.should.be.equal(false);

		var notfound = yield browser.url(sandbox.general.baseUrl + '/settings/general')
									.getText('.hp h1');
		notfound.should.be.equal('404 Page not found');

		link = yield browser.url(sandbox.general.baseUrl + '/unlock')
							.setValue('input#unlockCode', unlockCode)
							.submitForm('#unlock form')
							.isExisting('ul.nav > li > a');
		link.should.be.equal(true);
		
	});

	it('should have a link to the home page', function *() {

		var link = yield browser.isExisting('#unlock > div > a[href="/"]');
		link.should.be.equal(true);

		var linkText = yield browser.getText('#unlock > div > a[href="/"]');
		linkText.should.be.equal('or return to homepage');

	});

});