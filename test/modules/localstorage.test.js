
// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var localstorage = require('../../lib/localstorage');
var provider = localstorage({ localstoragepath: __dirname });

// ------------------------------------------------------------------------------------------ Mock Dependencies

var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mime = require('mime');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Local Storage module', function() {
	var sandbox;

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should be possible to set options by Object', function() {
		var instance = localstorage({ localstoragepath: __dirname });
		instance.localstoragepath.should.equals(__dirname);
	});

	it('should be possible to set options by String', function() {
		var instance = localstorage(__dirname);
		instance.localstoragepath.should.equals(__dirname);
	});

	it('should throw an error when setting options by Integer', function() {
		try {
			var instance = localstorage(100);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
			err.should.equals('Invalid options provided');
		}
	});

	// -------------------------------------------------------------------------------------- Testing file upload

	it('should be possible to upload a file', function(done) {
		var uploadedFile = {
			path: path.join(__dirname, 'file.tmp'),
			data: 'my awesome content',
			context: {
				path: path.join(__dirname, 'file.binary'),
				jsonPath: path.join(__dirname, 'file.json')
			}
		}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'readFile', function (file, callback) {
			file.should.equals(uploadedFile.path);
			callback(null, uploadedFile.data);
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			if(typeof encoding == "string") {
				file.should.equals(uploadedFile.context.jsonPath);
				data.should.equals(JSON.stringify(uploadedFile.context));
				callback(null);				
			} else {
				callback = encoding;
				file.should.equals(uploadedFile.context.path);
				data.should.equals(uploadedFile.data);
				callback(null);
			}
		});

		provider.upload(uploadedFile, uploadedFile.context, function(err, context) {
			should.not.exist(err);
			context.should.equals(uploadedFile.context);
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing bundle creation

	it('should be possible to create a bundle', function(done) {
		var bundle = {
			path: path.join(__dirname, 'file.json')
		}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			encoding.should.equals('utf-8');
			file.should.equals(bundle.path);
			data.should.equals(JSON.stringify(bundle));
			callback(null);
		});

		provider.bundle(bundle, function(err) {
			should.not.exist(err);
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing archive download

	it('should be possible to download an archive', function() {

		var token = 'bundle';
		var bundle = {
			files: [
				{
					id: 'file',
					name: 'filename'
				}
			]
		}

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf-8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(bundle));
		});

		var zip = {
			file: function() {},
			pipe: function() {},
			finalize: function() {}
		};
		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('file').once().withArgs(path.join(__dirname, bundle.files[0].id + '.binary'), { name: bundle.files[0].name });
		sandbox.stub(archiver, 'create').returns(zip);

		var res = {
			setHeader: function() {},
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.not.exist(err);
		});

	});

	// -------------------------------------------------------------------------------------- Testing file download

	it('should be possible to download a file', function(done) {

		var token = 'file';
		var context = {
			name: 'filename',
			size: 10,
			mimetype: 'binary'
		};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf-8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		var stream = {
			pipe: function() {}
		}
		var streamMock = sandbox.mock(stream);
		streamMock.expects("pipe").once();
		sandbox.stub(fs, 'createReadStream').returns(stream);

		sandbox.stub(mime, 'lookup').returns(context.mimetype);

		var res = {
			setHeader: function() {},
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("setHeader").once().withArgs('Content-type', context.mimetype);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing file purge

	it('should be possible to purge files', function(done) {
		sandbox.stub(fs, 'readdir', function (path, callback) {
			callback(null, ['file.json']);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			file.should.equals(path.join(__dirname, 'file.json'));
			callback(null, JSON.stringify({ expires: 1234, path: 'file.binary', jsonPath: 'file.json' }));
		});

		provider.on('localstorage.purged', function(err, paths) {
			var paths = JSON.stringify(paths);
			paths.should.equals('["file.binary","file.json"]');
			done();
		});

		provider.purge();
	});

});