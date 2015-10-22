'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

require('date-utils');
var sinon = require('sinon');
var should = require('chai').should();
var s3storage = require('../../lib/s3storage');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var mime = require('mime');
var stream = require('stream');
var zlib = require('zlib');
var validator = require('validator');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Amazon S3 Storage module', function() {
	var sandbox;
	var provider;

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		provider = s3storage({
			storage: {
				S3AccessKeyId: 'AccessKeyId',
				S3SecretAccessKey: 'SecretAccessKey',
				S3Region: 'Region',
				S3SSLEnabled: true,
				S3Bucket: 'MyBucket'
			}
		});
	});

	afterEach(function() {
		sandbox.restore();
		provider = null;
	});

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should accept options by Object', function() {
		var instance = s3storage({ 
			storage: {
				S3AccessKeyId: 'AccessKeyId',
				S3SecretAccessKey: 'SecretAccessKey',
				S3Region: 'Region',
				S3SSLEnabled: true,
				S3Bucket: 'MyBucket'
			}
		});
		should.exist(instance.s3obj);
		instance.s3obj.config.credentials.accessKeyId.should.equals('AccessKeyId');
		instance.s3obj.config.credentials.secretAccessKey.should.equals('SecretAccessKey');
		instance.s3obj.config.region.should.equals('Region');
		instance.s3obj.config.sslEnabled.should.equals(true);
		instance.s3obj.config.params['Bucket'].should.equals('MyBucket');
	});

	it('should throw an error when setting options by Null Object', function() {
		try {
			var instance = s3storage(null);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
			err.should.equals('Invalid options provided');
		}
	});

	it('should accept options by empty Object', function() {
		var instance = s3storage({});
		should.not.exist(instance.s3obj.config.credentials);
	});

	it('should throw an error when setting options by Integer', function() {
		try {
			var instance = s3storage(100);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
			err.should.equals('Invalid options provided');
		}
	});

	// -------------------------------------------------------------------------------------- Testing JSON retrieval

	it('should implement the "getJSON" method and enable retrieval of JSON metadata of file', function(done) {

		var token = 'file',
			data = {
				Metadata: {
					json: JSON.stringify({
						key: 'value'						
					})
				}
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				},
				error: new Error('error')
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, data);

		provider.getJSON(token, function(err, value) {
			should.not.exist(err);
			done();
		});

	});

	it('should implement the "getJSON" method and enable retrieval of JSON metadata of bundle', function(done) {

		var token = 'bundle',
			data = {
				Body: JSON.stringify({
					key: 'value'						
				})
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				},
				error: new Error('error')
			}

		sandbox.stub(validator, 'isUUID').returns(true);

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, data);

		provider.getJSON(token, function(err, value) {
			should.not.exist(err);
			done();
		});

	});	

	it('should implement the "getJSON" method and continue with erronous callback if retrieval of JSON metadata fails', function(done) {

		var token = 'bundle',
			data = {
				Body: JSON.stringify({
					key: 'value'						
				})
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				},
				error: new Error('error')
			}

		sandbox.stub(validator, 'isUUID').returns(true);

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, s3obj.error, null);

		provider.getJSON(token, function(err, value) {
			should.exist(err);
			err.should.equals(s3obj.error);
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing file upload

	it('should implement the "upload" method and enable Amazon S3 storage of a file', function(done) {

		var file = {
			id: 'file',
			path: 'path',
			context: {}
		}

		var s = new stream.Readable();
		s.push('data');
		s.push(null);
		sandbox.stub(fs, 'createReadStream').returns(s);

		sandbox.stub(provider.s3obj, 'upload', function (options, callback) {
			should.exist(options);
			options.Key.should.equals(file.id);
			options.Metadata.json.should.equals(JSON.stringify(file.context));
			callback(null, file.context);
		});

		provider.upload(file, file.context, function(err, context) {
			should.not.exist(err);
			context.should.equals(file.context);
			done();
		});
	});

	it('should continue with erronous callback if uploaded file cannot be read', function(done) {

		var file = {
			id: 'file',
			path: 'path',
			context: {}
		}

		sandbox.stub(fs, 'createReadStream').throws(new Error('error'));

		provider.upload(file, file.context, function(err, context) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});
	});	

	// -------------------------------------------------------------------------------------- Testing bundle creation

	it('should be possible to create a bundle', function(done) {
		var bundle = {
			id: 'bundle',
			path: path.join(__dirname, 'file.json')
		}

		sandbox.stub(provider.s3obj, 'upload', function (options, callback) {
			should.exist(options);
			options.Key.should.equals(bundle.id);
			callback(null, bundle);
		});

		provider.bundle(bundle, function(err) {
			should.not.exist(err);
			done();
		});
	});

	it('should continue with erronous callback if bundle upload throws an error', function(done) {
		var bundle = {
			id: 'bundle',
			path: path.join(__dirname, 'file.json')
		}

		sandbox.stub(provider.s3obj, 'upload').throws(new Error('error'));

		provider.bundle(bundle, function(err) {
			should.exist(err);
			err.message.should.equals('error');
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
			res = {
				setHeader: function() {},
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			},
			readstream = {
				createReadStream: function() { 
					return {
						pipe: function() {}
					}
				},
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, { Body: JSON.stringify(bundle) });
		s3objMock.expects('getObject').once().withArgs({ Key: bundle.files[0].id }).returns(readstream);

		var zip = {
			on: function() {},
			append: function() {},
			pipe: function() {},
			finalize: function() {}
		};
		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('append').once();
		zipMock.expects('on').once().callsArgAsync(1);
		sandbox.stub(archiver, 'create').returns(zip);

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.not.exist(err);
			s3objMock.verify();
			zipMock.verify();
			done();
		});

	});

	it('should be possible to download an archive without expiration date', function(done) {

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
			res = {
				setHeader: function() {},
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			},
			readstream = {
				createReadStream: function() { 
					return {
						pipe: function() {}
					}
				},
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, { Body: JSON.stringify(bundle) });
		s3objMock.expects('getObject').once().withArgs({ Key: bundle.files[0].id }).returns(readstream);

		var zip = {
			on: function() {},
			append: function() {},
			pipe: function() {},
			finalize: function() {}
		};
		var zipMock = sandbox.mock(zip);
		zipMock.expects('pipe').once();
		zipMock.expects('finalize').once();
		zipMock.expects('append').once();
		zipMock.expects('on').once().callsArgAsync(1);
		sandbox.stub(archiver, 'create').returns(zip);

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="bundle.zip"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');

		provider.archive(token, res, function(err) {
			should.not.exist(err);
			s3objMock.verify();
			zipMock.verify();
			done();
		});

	});

	it('should continue with erronous callback if archive token is unknown', function(done) {

		provider.archive(null, null, function(err) {
			should.exist(err);
			err.should.equals('Bundle identifier unknown');
			done();
		});

	});	

	it('should continue with erronous callback if archive token retrieval throws error', function(done) {

		var token = 'bundle',
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				},
				error: new Error('error')
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, s3obj.error, null);

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.message.should.equals(s3obj.error.message);
			done();
		});

	});	

	it('should continue with erronous callback if archive bundle retrieval throws error', function(done) {

		var token = 'bundle',
			bundle = {},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, { Body: JSON.stringify(bundle) });

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.should.equals('Invalid bundle data');
			done();
		});

	});

	it('should continue with erronous callback if archive bundle has expired', function(done) {

		var token = 'bundle',
			bundle = {
				expires: 1,
				files: [
					{
						id: 'file',
						name: 'filename'
					}
				]
			},
			res = {
				setHeader: function() {},
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			},
			readstream = {
				createReadStream: function() { 
					return {
						pipe: function() {}
					}
				},
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, { Body: JSON.stringify(bundle) });

		provider.archive(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('The requested bundle is no longer available.');
			s3objMock.verify();
			done();
		});

	});


	// -------------------------------------------------------------------------------------- Testing file download

	it('should be possible to download a file', function(done) {

		var token = 'file',
			context = {
				expires: Date.tomorrow(),
				name: 'filename',
				size: 10,
				type: 'binary'
			},
			data = {
				Body: 'data',
				Metadata: {
					json: JSON.stringify(context)
				}
			},
			res = {
				setHeader: function() {},
				send: function() {},
				on: function() {}
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, data);
		sandbox.stub(zlib, 'gunzip', function(data, callback) {
			callback(null, data);
		});

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("send").once().withArgs(data.Body);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			s3objMock.verify();
			resMock.verify();
			done();
		});
	});

	it('should be possible to download a file without expiration date', function(done) {

		var token = 'file',
			context = {
				name: 'filename',
				size: 10,
				type: 'binary'
			},
			data = {
				Body: 'data',
				Metadata: {
					json: JSON.stringify(context)
				}
			},
			res = {
				setHeader: function() {},
				send: function() {},
				on: function() {}
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, data);
		sandbox.stub(zlib, 'gunzip', function(data, callback) {
			callback(null, data);
		});

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Content-disposition', 'attachment; filename="' + context.name + '"');
		resMock.expects("setHeader").once().withArgs('Content-type', 'application/octet-stream');
		resMock.expects("setHeader").once().withArgs('Content-length', context.size);
		resMock.expects("send").once().withArgs(data.Body);
		resMock.expects("on").once().withArgs('finish').callsArgAsync(1);

		provider.download(token, res, function(err) {
			should.not.exist(err);
			s3objMock.verify();
			resMock.verify();
			done();
		});
	});

	it('continue with erronous callback if download token is unknown', function(done) {

		provider.download(null, null, function(err) {
			should.exist(err);
			err.should.equals('invalid token exception');
			done();
		});

	});

	it('should continue with erronous callback if download token retrieval throws error', function(done) {

		var token = 'file',
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				},
				error: new Error('error')
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, s3obj.error, null);

		provider.download(token, null, function(err) {
			should.exist(err);
			err.message.should.equals(s3obj.error.message);
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
			},
			data = {
				Body: 'data',
				Metadata: {
					json: JSON.stringify(context)
				}
			},
			res = {
				setHeader: function() {},
				send: function() {},
				on: function() {}
			},
			s3obj = {
				getObject: function() {},
				params: {
					Key: token
				}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('getObject').once().withArgs(s3obj.params).callsArgWith(1, null, data);

		provider.download(token, null, function(err) {
			should.exist(err);
			err.message.should.equals('The requested file is no longer available.');
			s3objMock.verify();
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing file purge

	it('should purge files with expire date in the past', function(done) {

		var objects = {
				Contents: [
					{
						Key: 'key'
					}
				]
			},
			data = {
				Metadata: {
					json: JSON.stringify({
						expires: 1234,
						name: 'file'
					})
				}
			},
			s3obj = {
				listObjects: function() {},
				headObject: function() {},
				deleteObject: function() {}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('listObjects').once().callsArgWith(0, null, objects);
		s3objMock.expects('headObject').once().callsArgWith(1, null, data);
		s3objMock.expects('deleteObject').once().withArgs({ Key: 'key' }).callsArgWith(1, null);

		provider.purge(function(err, files) {
			should.not.exist(err);
			files[0].should.equals('file');
			s3objMock.verify();
			done();
		});
	});

	it('should not purge files if there is no expire date set', function(done) {

		var objects = {
				Contents: [
					{
						Key: 'key'
					}
				]
			},
			data = {
				Metadata: {
					json: JSON.stringify({
						name: 'file'
					})
				}
			},
			s3obj = {
				listObjects: function() {},
				headObject: function() {},
				deleteObject: function() {}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('listObjects').once().callsArgWith(0, null, objects);
		s3objMock.expects('headObject').once().callsArgWith(1, null, data);

		provider.purge(function(err, files) {
			should.not.exist(err);
			files.length.should.equals(0);
			s3objMock.verify();
			done();
		});

	});

	it('should not purge files if there is expire date is set in the future', function(done) {

		var objects = {
				Contents: [
					{
						Key: 'key'
					}
				]
			},
			data = {
				Metadata: {
					json: JSON.stringify({
						expires: Date.tomorrow(),
						name: 'file'
					})
				}
			},
			s3obj = {
				listObjects: function() {},
				headObject: function() {},
				deleteObject: function() {}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('listObjects').once().callsArgWith(0, null, objects);
		s3objMock.expects('headObject').once().callsArgWith(1, null, data);

		provider.purge(function(err, files) {
			should.not.exist(err);
			files.length.should.equals(0);
			s3objMock.verify();
			done();
		});

	});

	it('should continue with erronous callback if file to purge cannot be read', function(done) {

		var objects = {
				Contents: [
					{
						Key: 'key'
					}
				]
			},
			data = {
				Metadata: {
					json: JSON.stringify({
						expires: Date.tomorrow(),
						name: 'file'
					})
				}
			},
			s3obj = {
				listObjects: function() {},
				headObject: function() {},
				deleteObject: function() {}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('listObjects').once().callsArgWith(0, null, objects);
		s3objMock.expects('headObject').once().callsArgWith(1, new Error('error'), null);

		provider.purge(function(err, files) {
			should.not.exist(err);
			files.length.should.equals(0);
			s3objMock.verify();
			done();
		});

	});

	it('should continue with erronous callback if s3obj throws error during purge', function(done) {

		var objects = {
				Contents: [
					{
						Key: 'key'
					}
				]
			},
			data = {
				Metadata: {
					json: JSON.stringify({
						expires: Date.tomorrow(),
						name: 'file'
					})
				}
			},
			s3obj = {
				listObjects: function() {},
				headObject: function() {},
				deleteObject: function() {}
			}

		provider.s3obj = s3obj;
		var s3objMock = sandbox.mock(s3obj);
		s3objMock.expects('listObjects').once().callsArgWith(0, null, objects);
		s3objMock.expects('headObject').once().throws(new Error('error'));

		provider.purge(function(err, files) {
			should.exist(err);
			err.message.should.equals('error');
			s3objMock.verify();
			done();
		});

	});

});