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

describe('Email Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/settings/email');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('Email');

	});

	it('should have a "Transport Mechanism" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('select[name="settings[email][transporter]"]');
		value.should.be.equal(sandbox.email.transporter);

	});

	it('should have a "Sender" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('input#sender')
		value.should.be.equal(sandbox.email.sender || '');

	});

	it('should have a "Subject" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('input#subject')
		value.should.be.equal(sandbox.email.subject || '');

	});

	it('should have a "Send copy to sender" checkbox with the current value based on user settings', function *() {

		var value = yield browser.getAttribute('input#sendCopy', 'checked')
		if(sandbox.email.sendCopy) {
			should.exist(value);
		} else {
			should.not.exist(value);
		}

	});

	it('should show all fields related to "SMTP" if the option is selected in the "Transport Mechanism" field', function *() {

		var value = yield browser.selectByVisibleText('select[name="settings[email][transporter]"]', 'SMTP')
								 .waitForVisible('div#smtp')
								 .getValue('select[name="settings[email][service]"]');
		value.should.be.equal(sandbox.email.service || 'Select provider');

		if(value === 'other') {
			var other = yield browser.isVisible('div#other');
			other.should.equal(true);

			var host = yield browser.getValue('input#host');
			host.should.be.equal(sandbox.email.host);

			var port = yield browser.getValue('input#port');
			port.should.be.equal(sandbox.email.port);
		}

		var username = yield browser.getValue('input#username');
		username.should.be.equal(sandbox.email.username || '');

		var password = yield browser.getValue('input#password');
		password.should.be.equal(sandbox.email.password || '');

	});

	it('should show all fields related to "Sendmail" if the option is selected in the "Transport Mechanism" field', function *() {

		var value = yield browser.selectByVisibleText('select[name="settings[email][transporter]"]', 'Sendmail')
								 .waitForVisible('div#sendmail')
								 .getValue('input#sendmailPath');
		value.should.be.equal(sandbox.email.sendmailPath);

	});

	it('should show all fields related to "Amazon SES" if the option is selected in the "Transport Mechanism" field', function *() {

		var value = yield browser.selectByVisibleText('select[name="settings[email][transporter]"]', 'Amazon SES')
								 .waitForVisible('div#ses')
								 .getValue('input#AccessKeyId');
		value.should.be.equal(sandbox.email.accessKeyId || '');

		var SecretAccessKey = yield browser.getValue('input#SecretAccessKey');
		SecretAccessKey.should.be.equal(sandbox.email.secretAccessKey || '');

		var region = yield browser.getValue('input#region');
		region.should.be.equal(sandbox.email.region);

		var rateLimit = yield browser.getValue('input#rateLimit');
		rateLimit.should.be.equal(sandbox.email.rateLimit.toString());

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

		var currentValue = sandbox.email.sender || '';
		var newValue = currentValue + '2';

		var value = yield browser.setValue('input#sender', newValue)
								 .submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active .alert strong', 5000)
								 .getText('.tab-pane.active .alert strong');
		value.should.be.equal('Success!');

		var title = yield browser.getValue('input#sender');
		title.should.be.equal(newValue);

		value = yield browser.setValue('input#sender', currentValue)
							 .submitForm('.tab-pane.active form')
							 .waitForExist('.tab-pane.active .alert strong', 5000)
							 .getText('.tab-pane.active .alert strong');
		value.should.be.equal('Success!');

		var value = yield browser.getValue('input#sender');
		value.should.be.equal(currentValue);

	});
});
