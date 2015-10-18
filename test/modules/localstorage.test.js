'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

require('date-utils');
var sinon = require('sinon');
var should = require('chai').should();
var localstorage = require('../../lib/localstorage');
var crypto = require('crypto');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mime = require('mime');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Local Storage module', function() {
	var sandbox;
	var provider;

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		provider = localstorage({ 
			storage: {
				localstoragepath: __dirname 
			},
			security: {
				encryptionEnabled: false
			}
		});
	});

	afterEach(function() {
		sandbox.restore();
		provider = null;
	});

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should accept options by Object', function() {
		var instance = localstorage({ 
			storage: {
				localstoragepath: __dirname 
			}
		});

		instance.localstoragepath.should.equals(__dirname);
	});

	it('should accept options by Null Object', function() {
		var instance = localstorage(null);
		instance.localstoragepath.should.equals(path.resolve('./lib'));
	});

	it('should accept options by empty Object', function() {
		var instance = localstorage({});
		instance.localstoragepath.should.equals(path.resolve('./lib'));
	});

	it('should throw an error when setting options by Integer', function() {
		try {
			var instance = localstorage(100);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
			err.message.should.equals('Invalid options provided');
		}
	});

	// -------------------------------------------------------------------------------------- Testing JSON retrieval

	it('should implement the "getJSON" method and enable retrieval of JSON metadata', function(done) {

		var metadata = {
			key: 'value'
		}

		sandbox.stub(fs, 'readFile', function (file, callback) {
			file.should.equals(path.join(provider.localstoragepath, 'file.json'));
			callback(null, JSON.stringify(metadata));
		});

		provider.getJSON('file', function(err, value) {
			value.key.should.equals(metadata.key);
			done()
		});
	});

	it('should implement the "getJSON" method and continue with erronous callback if JSON metadata retrieval failed', function(done) {

		var metadata = {
			key: 'value'
		}

		sandbox.stub(fs, 'readFile', function (file, callback) {
			file.should.equals(path.join(provider.localstoragepath, 'file.json'));
			callback(new Error('error'));
		});

		provider.getJSON('file', function(err, value) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});
	});

	it('should implement the "getJSON" method and continue with erronous callback if JSON metadata parsing failed', function(done) {

		var metadata = {
			key: 'value'
		}

		sandbox.stub(fs, 'readFile', function (file, callback) {
			file.should.equals(path.join(provider.localstoragepath, 'file.json'));
			callback(null, 'this is not JSON');
		});

		provider.getJSON('file', function(err, value) {
			should.exist(err);
			err.message.should.equals('Unexpected token h');
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing file upload

	it('should implement the "upload" method and enable local storage of a file', function(done) {
		var uploadedFile = {
				path: path.join(__dirname, 'file.tmp'),
				data: 'my awesome content',
				context: {
					path: path.join(__dirname, 'file.binary'),
					jsonPath: path.join(__dirname, 'file.json')
				}
			},
			stream = {
				on: function() {},
				pipe: function() {}
			}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'createReadStream', function (file) {
			file.should.equals(uploadedFile.path);
			return stream;
		});

		sandbox.stub(fs, 'createWriteStream', function (file) {
			file.should.equals(uploadedFile.context.path);
			return stream;
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			file.should.equals(uploadedFile.context.jsonPath);
			data.should.equals(JSON.stringify(uploadedFile.context));
			callback(null);
		});

		var streamMock = sandbox.mock(stream);
		streamMock.expects('pipe').once().returns(stream);
		streamMock.expects('on').withArgs('error').twice();
		streamMock.expects('on').withArgs('finish').once().callsArgAsync(1);

		provider.upload(uploadedFile, uploadedFile.context, function(err, context) {
			should.not.exist(err);
			context.should.equals(uploadedFile.context);
			streamMock.verify();
			done();
		});
	});

	it('should implement the "upload" method and enable local storage of an encrypted file', function(done) {
		provider = localstorage({
			storage: { 
				localstoragepath: __dirname
			},
			security: {
				encryptionEnabled: true,
				encryptionKey: 'MySecretEncryptionKey'
			}
		});

		var uploadedFile = {
				path: path.join(__dirname, 'file.tmp'),
				data: 'my awesome content',
				context: {
					path: path.join(__dirname, 'file.binary'),
					jsonPath: path.join(__dirname, 'file.json')
				}
			},
			stream = {
				on: function() {},
				pipe: function() {}
			}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'createReadStream', function (file) {
			file.should.equals(uploadedFile.path);
			return stream;
		});

		sandbox.stub(fs, 'createWriteStream', function (file) {
			file.should.equals(uploadedFile.context.path);
			return stream;
		});

		sandbox.stub(fs, 'writeFile', function (file, data, encoding, callback) {
			file.should.equals(uploadedFile.context.jsonPath);
			data.should.equals(JSON.stringify(uploadedFile.context));
			callback(null);
		});

		var cryptoMock = sandbox.mock(crypto);
		cryptoMock.expects('createCipher').once().returns(stream);

		var streamMock = sandbox.mock(stream);
		streamMock.expects('pipe').twice().returns(stream);
		streamMock.expects('on').withArgs('error').twice();
		streamMock.expects('on').withArgs('finish').once().callsArgAsync(1);

		provider.upload(uploadedFile, uploadedFile.context, function(err, context) {
			should.not.exist(err);
			context.should.equals(uploadedFile.context);
			cryptoMock.verify();
			streamMock.verify();
			done();
		});
	});

	it('should continue with erronous callback if uploaded file cannot be read', function(done) {
		var uploadedFile = {
				path: path.join(__dirname, 'file.tmp'),
				data: 'my awesome content',
				context: {
					path: path.join(__dirname, 'file.binary'),
					jsonPath: path.join(__dirname, 'file.json')
				}
			},
			readStream = {
				on: function() {},
				pipe: function() {}
			},
			writeStream = {
				on: function() {},
				pipe: function() {}
			}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'createReadStream', function (file) {
			file.should.equals(uploadedFile.path);
			return readStream;
		});

		sandbox.stub(fs, 'createWriteStream', function (file) {
			file.should.equals(uploadedFile.context.path);
			return writeStream;
		});

		var streamMock = sandbox.mock(readStream);
		streamMock.expects('pipe').once().returns(readStream);
		streamMock.expects('on').withArgs('error').once().callsArgWithAsync(1, new Error('error'));

		var writeStreamMock = sandbox.mock(writeStream);
		writeStreamMock.expects('on').withArgs('finish').once();
		writeStreamMock.expects('on').withArgs('error').once();

		provider.upload(uploadedFile, uploadedFile.context, function(err, context) {
			should.exist(err);
			err.message.should.equals('error');
			streamMock.verify();
			writeStreamMock.verify();
			done();
		});
	});

	it('should continue with erronous callback if uploaded file cannot be written', function(done) {
		var uploadedFile = {
				path: path.join(__dirname, 'file.tmp'),
				data: 'my awesome content',
				context: {
					path: path.join(__dirname, 'file.binary'),
					jsonPath: path.join(__dirname, 'file.json')
				}
			},
			readStream = {
				on: function() {},
				pipe: function() {}
			},
			writeStream = {
				on: function() {}
			}

		sandbox.stub(fs, 'mkdir', function (dir, callback) {
			dir.should.equals(__dirname);
			callback();
		});

		sandbox.stub(fs, 'createReadStream', function (file) {
			file.should.equals(uploadedFile.path);
			return readStream;
		});

		sandbox.stub(fs, 'createWriteStream', function (file) {
			file.should.equals(uploadedFile.context.path);
			return writeStream;
		});

		var streamMock = sandbox.mock(readStream);
		streamMock.expects('pipe').once().returns(readStream);
		streamMock.expects('on').withArgs('error').once();

		var writeStreamMock = sandbox.mock(writeStream);
		writeStreamMock.expects('on').withArgs('finish').once();
		writeStreamMock.expects('on').withArgs('error').once().callsArgWithAsync(1, new Error('error'));

		provider.upload(uploadedFile, uploadedFile.context, function(err, context) {
			should.exist(err);
			err.message.should.equals('error');
			streamMock.verify();
			writeStreamMock.verify();
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
			encoding.should.equals('utf8');
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

	it('should be possible to download an archive', function(done) {

		var token = 'bundle',
			bundle = {
				expires: Date.tomorrow(),
				files: [
					{
						id: 'file',
						name: 'filename'
					}
				]
			},
			zip = {
				on: function() {},
				file: function() {},
				pipe: function() {},
				finalize: function() {}
			},
			res = {
				setHeader: function() {},
			};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(bundle));
		});

		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('on').once().withArgs('finish').callsArgAsync(1);
		zipMock.expects('file').once().withArgs(path.join(__dirname, bundle.files[0].id + '.binary'), { name: bundle.files[0].name });
		sandbox.stub(archiver, 'create').returns(zip);

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			zipMock.verify();
			done();
		});

	});

	it('should be possible to download an archive with encrypted files', function(done) {
		provider = localstorage({ 
			storage: {
				localstoragepath: __dirname
			},
			security: {
				encryptionEnabled: true,
				encryptionKey: 'MySecretEncryptionKey'
			}
		});

		var data = "my binary data";
		var cipher = crypto.createCipher('aes-256-ctr', 'MySecretEncryptionKey');
		var buffer = Buffer.concat([cipher.update(data) , cipher.final()]);

		var token = 'bundle',
			bundle = {
				expires: Date.tomorrow(),
				files: [
					{
						id: 'file',
						name: 'filename'
					}
				]
			},
			zip = {
				on: function() {},
				file: function() {},
				append: function() {},
				pipe: function() {},
				finalize: function() {}
			},
			res = {
				setHeader: function() {},
			}


		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			if(file.match(/.json$/)) {
				encoding.should.equals('utf8');
				file.should.equals(path.join(__dirname, token + '.json'));
				callback(null, JSON.stringify(bundle));
			} else {
				callback = encoding;
				file.should.equals(path.join(__dirname, bundle.files[0].id + '.binary'));
				callback(null, buffer);
			}
		});

		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('on').once().withArgs('finish').callsArgAsync(1);
		zipMock.expects('append').once().withArgs(new Buffer(data), { name: bundle.files[0].name });
		sandbox.stub(archiver, 'create').returns(zip);

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			zipMock.verify();
			done();
		});

	});

	it('should be possible to download an archive without expiration date', function(done) {

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
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(bundle));
		});

		var zip = {
			on: function() {},
			file: function() {},
			pipe: function() {},
			finalize: function() {}
		};
		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('on').once().withArgs('finish').callsArgAsync(1);
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
			resMock.verify();
			zipMock.verify();
			done();
		});

	});

	it('should continue with erronous callback if archive token is unknown', function(done) {

		provider.archive(null, null, function(err) {
			should.exist(err);
			err.message.should.equals('Bundle identifier unknown');
			done();
		});

	});	

	it('should continue with erronous callback if archive token path traversal detection throws error', function(done) {

		var token = '../../some/sneaky/path';

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('Invalid token provided');
			done();
		});

	});

	it('should continue with erronous callback if archive token retrieval throws error', function(done) {

		var token = 'bundle',
			bundle = {
				files: [
					{
						id: 'file',
						name: 'filename'
					}
				]
			}

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback('error', null);
		});

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.should.equals('error');
			done();
		});

	});

	it('should continue with erronous callback if archive bundle retrieval throws error', function(done) {

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
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, '{}');
		});

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('Invalid bundle data');
			done();
		});

	});	

	it('should continue with erronous callback if archive bundle has expired', function(done) {

		var token = 'bundle';
		var bundle = {
			expires: 1,
			files: [
				{
					id: 'file',
					name: 'filename'
				}
			]
		}

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(bundle));
		});

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('The requested bundle is no longer available.');
			done();
		});

	});	

	it('should continue with erronous callback if archive file path traversal detection throws error', function(done) {

		var token = 'bundle';
		var bundle = {
			expires: Date.tomorrow(),
			files: [
				{
					id: '../../some/sneaky/path',
					name: 'filename'
				}
			]
		}

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(bundle));
		});

		var zip = {
			on: function() {},
		};
		var zipMock = sandbox.mock(zip);
		zipMock.expects('on').once().withArgs('finish').callsArgAsync(1);
		sandbox.stub(archiver, 'create').returns(zip);

		var res = {
			setHeader: function() {},
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.exist(err);
			err.message.should.equals('Invalid token provided');
			zipMock.verify();
			done();
		});

	});	

	// -------------------------------------------------------------------------------------- Testing file download

	it('should be possible to download a file', function(done) {

		var token = 'file';
		var context = {
			expires: Date.tomorrow(),
			name: 'filename',
			size: 10,
			type: 'binary'
		};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		var stream = {
			pipe: function() {},
		}
		var streamMock = sandbox.mock(stream);
		streamMock.expects("pipe").once();
		sandbox.stub(fs, 'createReadStream').returns(stream);

		sandbox.stub(mime, 'lookup').returns(context.type);

		var res = {
			setHeader: function() {},
			on: function() {}
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("setHeader").once().withArgs('Content-type', context.type);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			done();
		});
	});

	it('should be possible to download an encrypted file', function(done) {
		provider = localstorage({
			storage: {
				localstoragepath: __dirname
			},
			security: {
				encryptionEnabled: true,
				encryptionKey: 'MySecretEncryptionKey'
			}
		});

		var token = 'file',
			context = {
				expires: Date.tomorrow(),
				name: 'filename',
				size: 10,
				type: 'binary'
			},
			res = {
				setHeader: function() {},
				on: function() {}
			},
			stream = {
				pipe: function() {}
			}

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		sandbox.stub(mime, 'lookup').returns(context.type);

		sandbox.stub(crypto, "createDecipher").returns(stream);

		sandbox.stub(fs, 'createReadStream').returns(stream);

		sandbox.stub(stream, "pipe").returns(stream);

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("setHeader").once().withArgs('Content-type', context.type);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			done();
		});
	});

	it('should be possible to download a file without expiration date', function(done) {

		var token = 'file';
		var context = {
			name: 'filename',
			size: 10,
			type: 'binary'
		};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		var stream = {
			pipe: function() {},
		}
		var streamMock = sandbox.mock(stream);
		streamMock.expects("pipe").once();
		sandbox.stub(fs, 'createReadStream').returns(stream);

		sandbox.stub(mime, 'lookup').returns(context.type);

		var res = {
			setHeader: function() {},
			on: function() {}
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("setHeader").once().withArgs('Content-type', context.type);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			done();
		});
	});

	it('should be possible to download a file even if mimetype cannot be resolved automatically', function(done) {

		var token = 'file';
		var context = {
			name: 'filename',
			size: 10,
			type: 'binary'
		};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		var stream = {
			pipe: function() {}
		}
		var streamMock = sandbox.mock(stream);
		streamMock.expects("pipe").once();
		sandbox.stub(fs, 'createReadStream').returns(stream);

		sandbox.stub(mime, 'lookup').returns(null);

		var res = {
			setHeader: function() {},
			on: function() {}
		};
		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("setHeader").once().withArgs('Content-type', context.type);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			resMock.verify();
			done();
		});
	});

	it('continue with erronous callback if download token is unknown', function(done) {

		provider.download(null, null, function(err) {
			should.exist(err);
			err.message.should.equals('invalid token exception');
			done();
		});

	});

	it('should continue with erronous callback if download token retrieval throws error', function(done) {

		var token = 'file';

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback('error', null);
		});

		provider.download(token, null, function(err) {
			should.exist(err);
			err.should.equals('error');
			done();
		});

	});

	it('should continue with erronous callback if download file has expired', function(done) {

		var token = 'file',
			context = {
				expires: 1,
				name: 'filename',
				size: 10,
				type: 'binary'
			};

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			encoding.should.equals('utf8');
			file.should.equals(path.join(__dirname, token + '.json'));
			callback(null, JSON.stringify(context));
		});

		provider.download(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('The requested file is no longer available.');
			done();
		});
	});	

	it('should continue with erronous callback if download token path traversal detection throws error', function(done) {

		var token = '../../some/sneaky/path';

		provider.download(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('Invalid token provided');
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing file purge

	it('should purge files with expire date in the past', function(done) {
		sandbox.stub(fs, 'readdir', function (path, callback) {
			callback(null, ['file.json', 'file.tmp']);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			file.should.equals(path.join(__dirname, 'file.json'));
			callback(null, JSON.stringify({ expires: 1234, path: 'file.binary', jsonPath: 'file.json' }));
		});

		provider.purge(function(err, paths) {
			var paths = JSON.stringify(paths);
			paths.should.equals('["file.binary","file.json"]');
			done();
		});

	});

	it('should not purge files if there is no expire date set', function(done) {
		sandbox.stub(fs, 'readdir', function (path, callback) {
			callback(null, ['file.json', 'file.tmp']);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			file.should.equals(path.join(__dirname, 'file.json'));
			callback(null, JSON.stringify({ path: 'file.binary', jsonPath: 'file.json' }));
		});

		provider.purge(function(err, paths) {
			var paths = JSON.stringify(paths);
			paths.should.equals('[]');
			done();
		});
	});

	it('should not purge files if there is expire date is set in the future', function(done) {
		sandbox.stub(fs, 'readdir', function (path, callback) {
			callback(null, ['file.json', 'file.tmp']);
		});

		sandbox.stub(fs, 'readFile', function (file, encoding, callback) {
			file.should.equals(path.join(__dirname, 'file.json'));
			callback(null, JSON.stringify({ expires: Date.tomorrow(), path: 'file.binary', jsonPath: 'file.json' }));
		});

		provider.purge(function(err, paths) {
			var paths = JSON.stringify(paths);
			paths.should.equals('[]');
			done();
		});

	});

});