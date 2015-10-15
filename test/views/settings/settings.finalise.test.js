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

describe('Finalise Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/settings/finalise');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('Finalise');

	});

	it('should have a cancel button which will redirect to the General Settings page', function *() {

		var value = yield browser.getAttribute('.tab-pane.active form a.btn.btn-default', 'href')
		value.should.be.equal(sandbox.general.baseUrl + '/settings/general');

		var header = yield browser.click('.tab-pane.active form a.btn.btn-default')
								  .getText('.tab-pane.active h1');
		header.should.equals('General');

	});

	it('should have a submit button to finalise the settings', function *() {

		var value = yield browser.isExisting('.tab-pane.active form button[type="submit"]')
		value.should.be.equal(true);

	});

	it('should be able to finalise the settings', function *(done) {

		var unlockCode = sandbox.state.unlockCode || 'unlock';

		var link = yield browser.setValue('input#unlockCode', unlockCode)
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

});