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

describe('Storage Settings View', function() {

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
		yield browser.url(sandbox.general.baseUrl + '/settings/storage');
	});

	it('should have the window title based on user settings', function *() {

		var title = yield browser.getTitle()
		title.should.be.equal(sandbox.general.title);

	});

	it('should have the correct header title', function *() {

		var header = yield browser.getText('.tab-pane.active h1')
		header.should.be.equal('Storage');

	});

	it('should have a "Location" field with the current value based on user settings', function *() {

		var value = yield browser.getValue('select#StorageLocation');
		value.should.be.equal(sandbox.storage.location);

	});

	it('should have a "Retention" field with the current value based on user settings', function *() {

		var retention = yield browser.getValue('input#retention');
		retention.should.be.equal(sandbox.storage.retention.toString());

		var retentionUnit = yield browser.getValue('select#retentionUnit');
		retentionUnit.should.be.equal(sandbox.storage.retentionUnit);

	});

	it('should show all fields related to "Local file system" if the option is selected in the "Location" field', function *() {

		var value = yield browser.selectByVisibleText('select#StorageLocation', 'Local file system')
								 .waitForVisible('div#local')
								 .getValue('input#localstoragepath');
		value.should.be.equal(sandbox.storage.localstoragepath);

	});

	it('should show all fields related to "Amazon S3" if the option is selected in the "Location" field', function *() {

		var value = yield browser.selectByVisibleText('select#StorageLocation', 'Amazon S3')
								 .waitForVisible('div#s3')
								 .getValue('input#S3AccessKeyId');
		value.should.be.equal(sandbox.storage.S3AccessKeyId || '');

		var S3SecretAccessKey = yield browser.getValue('input#S3SecretAccessKey');
		S3SecretAccessKey.should.be.equal(sandbox.storage.S3SecretAccessKey || '');

		var S3Bucket = yield browser.getValue('input#S3Bucket');
		S3Bucket.should.be.equal(sandbox.storage.S3Bucket || '');

		var S3Region = yield browser.getValue('input#S3Region');
		S3Region.should.be.equal(sandbox.storage.S3Region);

		var S3SSLEnabled = yield browser.isExisting('input#S3SSLEnabled:checked');
		if(sandbox.storage.S3SSLEnabled) {
			S3SSLEnabled.should.equals(true);
		} else {
			S3SSLEnabled.should.equals(false);
		}
	});

	/*
	it('should have a "encryptionEnabled" field with the current value based on user settings', function *() {

		var encryptionEnabled = yield browser.isExisting('input#encryptionEnabled:checked');
		if(sandbox.storage.encryptionEnabled) {
			encryptionEnabled.should.equals(true);
		} else {
			encryptionEnabled.should.equals(false);
		}

	});

	it('should have a "Encryption Key" field with the current value based on user settings', function *() {

		var encryptionKey = yield browser.getValue('input#encryptionKey');
		encryptionKey.should.be.equal(sandbox.storage.encryptionKey);

	});
	*/
	
	it('should be able to save the settings', function *() {

		var alert = yield browser.isExisting('.tab-pane.active > .alert strong');
		alert.should.be.equal(false);

		var value = yield browser.submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active > .alert strong', 5000)
								 .getText('.tab-pane.active > .alert strong');
		value.should.be.equal('Success!');

	});

	it('should be able to alter and save the settings', function *() {

		var alert = yield browser.isExisting('.tab-pane.active > .alert strong');
		alert.should.be.equal(false);

		var currentValue = sandbox.storage.retention.toString();
		var newValue = currentValue + '2';

		var alert = yield browser.setValue('input#retention', newValue)
								 .submitForm('.tab-pane.active form')
								 .waitForExist('.tab-pane.active > .alert strong', 5000)
								 .getText('.tab-pane.active > .alert strong');
		alert.should.be.equal('Success!');

		var value = yield browser.getValue('input#retention');
		value.should.be.equal(newValue);

		alert = yield browser.setValue('input#retention', currentValue)
							 .submitForm('.tab-pane.active form')
							 .waitForExist('.tab-pane.active > .alert strong', 5000)
							 .getText('.tab-pane.active > .alert strong');
		alert.should.be.equal('Success!');

		value = yield browser.getValue('input#retention');
		value.should.be.equal(currentValue);

	});
});