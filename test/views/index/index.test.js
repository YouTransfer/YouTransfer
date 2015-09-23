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

		var element = yield browser.element('ul.nav > li > a');
		should.exist(element);
		
		var linkText = yield browser.getText('ul.nav > li > a')
		linkText.should.be.equal('Settings');

	});
});