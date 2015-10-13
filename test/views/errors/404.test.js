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

describe('404 Error View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/404');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the error code and message in the header title ', function *() {

		var header = yield browser.getText('#notfound h1')
		header.should.be.equal('404 Page not found');

	});

	it('should have some cheeky subtitle', function *() {

		var subtitle = yield browser.getText('#notfound h2')
		subtitle.should.be.equal('Unless you were deliberatly looking for this beautiful error message ;)');

	});

	it('should have a link to the home page', function *() {

		var link = yield browser.isExisting('#notfound a[href="/"]');
		link.should.be.equal(true);

		var linkText = yield browser.getText('#notfound a[href="/"]');
		linkText.should.be.equal('No worries, you can safely return to the homepage');

	});
});