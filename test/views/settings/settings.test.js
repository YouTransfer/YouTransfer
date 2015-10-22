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

describe('Settings View', function() {

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

	it('should have a tabbed menu with 6 tabs', function *() {

		var menu = yield browser.isExisting('.settings ul[role="tablist"]')
		menu.should.be.equal(true);

		var items = yield browser.elements('.settings ul[role="tablist"] li a');
		items.value.length.should.be.equal(6);

	});

	it('should have a "General" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/general"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/general"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('General');

	});

	it('should have a "Security" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/security"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/security"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('Security');

	});

	it('should have a "Transfer" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/transfer"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/transfer"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('Transfer');

	});

	it('should have an "Email" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/email"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/email"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('Email');

	});

	it('should have an "Storage" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/storage"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/storage"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('Storage');

	});

	it('should have an "Templates" tab', function *() {

		var item = yield browser.isExisting('.settings ul[role="tablist"] li a[href="/settings/template"]');
		item.should.be.equal(true);

		var header = yield browser.click('.settings ul[role="tablist"] li a[href="/settings/template"]')
								  .waitForExist('.tab-pane.active h1')
								  .getText('.tab-pane.active h1');
		header.should.be.equal('Templates');

	});

	it('should have a finalise button', function *() {

		var item = yield browser.isExisting('.settings .finalise a[href="/settings/finalise"]');
		item.should.be.equal(true);

	});

	it('should have a link to the home page', function *() {

		var link = yield browser.isExisting('.settings ul.nav a[href="/"]');
		link.should.be.equal(true);

		var linkText = yield browser.getText('.settings ul.nav a[href="/"]');
		linkText.should.be.equal('Return to homepage');

	});

});