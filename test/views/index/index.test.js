'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var should = require('chai').should();
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: 'local.json' })
	 .file({ file: 'config.json' })
	 .file({ file: 'settings.json' });

describe('Index View', function() {

	before(function *() {
		yield browser
				.url(nconf.get('baseUrl'))
	});

	it('should have the correct window title', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(nconf.get('title'));

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('#hp header h1')
		header.should.be.equal(nconf.get('title'));

	});

	it('should have the correct header subtitle', function *() {

		var subtitle = yield browser.getText('#hp header h2')
		subtitle.should.be.equal(nconf.get('subtitle'));

	});

	it('should have a link to the settings page', function *() {

		var element = yield browser.element('ul.nav > li > a');
		should.exist(element);
		
		var linkText = yield browser.getText('ul.nav > li > a')
		linkText.should.be.equal('Settings');

	});
});