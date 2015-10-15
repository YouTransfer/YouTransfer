
// ------------------------------------------------------------------------------------------ Test Dependencies

var _ = require('lodash');
var sinon = require('sinon');
var should = require('chai').should();
var filesize = require("filesize");
var path = require('path');
var youtransfer = require('../../lib/youtransfer');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var scheduler = require('../../lib/scheduler');
var nodemailer = require('nodemailer');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer module', function() {
	var sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	})

	// -------------------------------------------------------------------------------------- Testing initialize

	it('should be possible to initialize module (incl. scheduling of background jobs)', function(done) {

		var settings = {
			general: {
				schedulerEnabled: true,
				cleanupSchedule: 'cronschedule'
			},
			security: {
				encryptionKey: 'MySecretKey'
			},
			on: function() {}
		}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.settings, "on", function(event, callback) {
			callback(null, settings);
		});

		sandbox.stub(scheduler, "add", function(name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
		});

		sandbox.stub(scheduler, "reschedule", function(name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
			done();
		});

		youtransfer.initialize();
	});

	it('should be possible to initialize module (incl. scheduling of background jobs) even when scheduler is disabled', function(done) {

		var settings = {
			general: {
				schedulerEnabled: false,
			},
			security: {}
		}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.settings, "push", function (settings, callback) {
			settings.security.encryptionKeyMethod.should.equals('auto');
			done();
		});

		youtransfer.initialize();
	});

	it('should be possible to initialize module (incl. scheduling of background jobs) without pre-set encryption key', function(done) {

		var settings = {
			general: {
				schedulerEnabled: true,
				cleanupSchedule: 'cronschedule'
			},
			security: {},
			on: function() {}
		}

		var completed = _.after(2, done);

		sandbox.stub(youtransfer.settings, "get", function (callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.settings, "push", function (settings, callback) {
			settings.security.encryptionKeyMethod.should.equals('auto');
			callback(null);
			completed();
		});

		sandbox.stub(youtransfer.settings, "on", function (event, callback) {
			callback(null, settings);
		});

		sandbox.stub(scheduler, "add", function (name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
		});

		sandbox.stub(scheduler, "reschedule", function (name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
			completed();
		});

		youtransfer.initialize();
	});

	it('should throw an error when such occurs during initialization of the module (incl. scheduling of background jobs) without pre-set encryption key', function(done) {

		var settings = {
			general: {
				schedulerEnabled: true,
				cleanupSchedule: 'cronschedule'
			},
			security: {},
			on: function() {}
		}

		sandbox.stub(youtransfer.settings, "get", function (callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.settings, "push", function (settings, callback) {
			callback(new Error('error'));
		});

		sandbox.stub(youtransfer.settings, "on", function (event, callback) {
			callback(null, settings);
		});

		sandbox.stub(scheduler, "add", function (name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
		});

		sandbox.stub(scheduler, "reschedule", function (name, schedule, job) {
			name.should.equals('cleanup');
			schedule.should.equals(settings.general.cleanupSchedule);
			should.exist(job);
		});

		try {
			youtransfer.initialize();
			fail('Reached this breakpoint', 'should not have reached this breakpoint');
		} catch(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		}
	});

	it('should continue if an error occurs while initializing module', function() {
		sandbox.stub(youtransfer.settings, "get", function (callback) {
			callback(new Error('error'), null);
		});

		youtransfer.initialize();
	});

	// -------------------------------------------------------------------------------------- Testing storageFactory

	it('should be possible to retrieve the default storage provider from the storage factory', function(done) {

		var settings = {
			storage: {
			}
		}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		youtransfer.storageFactory.get(function(err, factory) {
			should.not.exist(err);
			should.exist(factory);
			done();
		});

	});

	it('should be possible to retrieve the local storage provider from the storage factory', function(done) {

		var settings = {
				storage: {
					location: 'local'
				}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		youtransfer.storageFactory.get(function(err, factory) {
			should.not.exist(err);
			should.exist(factory.options.storage.location);
			factory.options.storage.location.should.equals(settings.storage.location);
			done();
		});

	});

	it('should be possible to retrieve the Amazon S3 storage provider from the storage factory', function(done) {

		var settings = {
				storage: {
					location: 's3'
				}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		youtransfer.storageFactory.get(function(err, factory) {
			should.not.exist(err);
			should.exist(factory.options.storage.location);
			factory.options.storage.location.should.equals(settings.storage.location);
			done();
		});

	});

	it('should continue with erronous callback if an error occurs while retrieving the storage provider from the storage factory', function(done) {

		var settings = {
			storage: {
				location: 'unknown'
			}
		}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		youtransfer.storageFactory.get(function(err, factory) {
			should.exist(err);
			should.not.exist(factory);
			err.message.should.equals('Storage provider not supported');
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing upload

	it('should be possible to upload a file', function(done) {

		var file = {
				id: 'file',
				name: 'file',
				type: 'file',
				size: 1024,
				lastModifiedDate: 'now'
			},
			bundle = 'bundle',
			settings = {
				general: {
					baseUrl: ''
				},
				storage: {
					localstoragepath: __dirname,
					retentionUnit: 'seconds',
					retention: 1
				},
				dropzone: {
					maxFilesize: 2000
				}
			},
			factory = {
				upload: function() {}
			};

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});
		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "upload", function(file, context, callback) {
			should.exist(file);
			should.exist(context);
			context.size.should.equals(file.size);
			context.filesize.should.equals(filesize(file.size));
			context.type.should.equals(file.type)
			context.lastModifiedDate.should.equals(file.lastModifiedDate);
			callback();
		});

		youtransfer.upload(file, bundle, function() {
			done();
		});
	});

	it('should be possible to upload a file without retention', function(done) {

		var file = {
				id: 'file',
				name: 'file',
				type: 'file',
				size: 1024,
				lastModifiedDate: 'now'
			},
			bundle = 'bundle',
			settings = {
				general: {
					baseUrl: ''
				},
				storage: {
					localstoragepath: __dirname,
					retentionUnit: 'seconds'
				},
				dropzone: {
					maxFilesize: 2000
				}
			},
			factory = {
				upload: function() {}
			};

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});
		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "upload", function(file, context, callback) {
			should.exist(file);
			should.exist(context);
			context.size.should.equals(file.size);
			context.filesize.should.equals(filesize(file.size));
			context.type.should.equals(file.type)
			context.lastModifiedDate.should.equals(file.lastModifiedDate);
			context.expires.should.equals(false);
			callback();
		});

		youtransfer.upload(file, bundle, function() {
			done();
		});
	});	

	it('should not be possible to upload a file if the size exceeds the maxFilesize setting', function(done) {

		var file = {
				id: 'file',
				name: 'file',
				type: 'file',
				size: 100000000,
				lastModifiedDate: 'now'
			},
			bundle = 'bundle',
			settings = {
				general: {
					baseUrl: ''
				},
				storage: {
					localstoragepath: __dirname,
					retentionUnit: 'seconds',
					retention: 1
				},
				dropzone: {
					maxFilesize: 0.1
				}
			},
			factory = {
				upload: function() {}
			};

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		youtransfer.upload(file, bundle, function(err, context) {
			should.exist(err);
			err.message.should.equals('File "file" is too big (95.37 MB). Max filesize: 0.1MiB.');
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing bundle

	it('should be possible to upload a bundle', function(done) {

		var bundle = {
				id: 'bundle'
			}
			settings = {
				general: {
					baseUrl: ''
				},
				storage: {
					localstoragepath: __dirname,
					retentionUnit: 'seconds',
					retention: 1
				}
			},
			factory = {
				bundle: function() {}
			};

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});
		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "bundle", function(context, callback) {
			should.exist(context);
			context.id.should.equals(bundle.id);
			context.path.should.equals(path.join(__dirname, bundle.id + '.json'));
			callback();
		});

		youtransfer.bundle(bundle, function() {
			done();
		});
	});

	it('should be possible to upload a bundle without retention', function(done) {

		var bundle = {
				id: 'bundle'
			}
			settings = {
				general: {
					baseUrl: ''
				},
				storage: {
					localstoragepath: __dirname,
					retentionUnit: 'seconds'
				}
			},
			factory = {
				bundle: function() {}
			};

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});
		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "bundle", function(context, callback) {
			should.exist(context);
			context.id.should.equals(bundle.id);
			context.path.should.equals(path.join(__dirname, bundle.id + '.json'));
			context.expires.should.equals(false);
			callback();
		});

		youtransfer.bundle(bundle, function() {
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing download

	it('should be possible to download a file', function(done) {

		var token = 'file',
			factory = {
				download: function() {}
			};

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "download", function(file, res, callback) {
			should.exist(token);
			file.should.equals(token)
			callback();
		});

		youtransfer.download(token, null, function() {
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing archive

	it('should be possible to download a bundle', function(done) {

		var token = 'file',
			factory = {
				archive: function() {}
			};

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "archive", function(file, res, callback) {
			should.exist(token);
			file.should.equals(token)
			callback();
		});

		youtransfer.archive(token, null, function() {
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing cleanup

	it('should be possible to trigger a purge', function(done) {

		var factory = {
				purge: function() {}
			};

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});
		sandbox.stub(factory, "purge", function(callback) {
			callback(null, [ 'file' ]);
		});

		youtransfer.cleanup(function(err, files) {
			should.exist(files);
			files[0].should.equals('file');
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing send

	// THIS TEST IS NOT REALLY DOING ANYTHING OTHER THAN CONFIRMING THAT THE LINES WHERE CALLED AND CONTROL FLOW FOLLOWED
	// TODO: add checks to all stub calls to verify if email creation is done correctly

	it('should be possible to send an email using smtp with known service', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					service: 'gmail',
					transporter: 'smtp',
					sender: 'sender',
					subject: 'subject',
					sendCopy: true
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			fields.bundle.id.should.equals(req.params.bundle);
			fields.bundle.link.should.equals(settings.general.baseUrl + '/bundle/' + req.params.bundle);
			fields.files[0].id.should.equals('file');
			callback(null, 'body');
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			email.from.should.equals(settings.email.sender);
			email.to.should.equals(req.params.email.to);
			email.subject.should.equals(settings.email.subject);
			email.html.should.equals('body');
			email.cc.should.equals(settings.email.sender);
			callback();
		});

		youtransfer.send(req, res, function() {
			done();
		});
	});

	it('should be possible to send an email using smtp with unknown service', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					service: '',
					transporter: 'smtp',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			fields.bundle.id.should.equals(req.params.bundle);
			fields.bundle.link.should.equals(settings.general.baseUrl + '/bundle/' + req.params.bundle);
			fields.files[0].id.should.equals('file');
			callback(null, 'body');
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			email.from.should.equals(settings.email.sender);
			email.to.should.equals(req.params.email.to);
			email.subject.should.equals(settings.email.subject);
			email.html.should.equals('body');
			callback();
		});

		youtransfer.send(req, res, function() {
			done();
		});
	});

	it('should be possible to send an email using sendmail', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					transporter: 'sendmail',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			fields.bundle.id.should.equals(req.params.bundle);
			fields.bundle.link.should.equals(settings.general.baseUrl + '/bundle/' + req.params.bundle);
			fields.files[0].id.should.equals('file');
			callback(null, 'body');
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			email.from.should.equals(settings.email.sender);
			email.to.should.equals(req.params.email.to);
			email.subject.should.equals(settings.email.subject);
			email.html.should.equals('body');
			callback();
		});

		youtransfer.send(req, res, function() {
			done();
		});
	});	

	it('should be possible to send an email using Amazon SES', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					transporter: 'ses',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			fields.bundle.id.should.equals(req.params.bundle);
			fields.bundle.link.should.equals(settings.general.baseUrl + '/bundle/' + req.params.bundle);
			fields.files[0].id.should.equals('file');
			callback(null, 'body');
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			email.from.should.equals(settings.email.sender);
			email.to.should.equals(req.params.email.to);
			email.subject.should.equals(settings.email.subject);
			email.html.should.equals('body');
			callback();
		});

		youtransfer.send(req, res, function() {
			done();
		});
	});	

	it('should be possible to send an email using direct MX connection', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					transporter: 'notsupported',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			fields.bundle.id.should.equals(req.params.bundle);
			fields.bundle.link.should.equals(settings.general.baseUrl + '/bundle/' + req.params.bundle);
			fields.files[0].id.should.equals('file');
			callback(null, 'body');
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			email.from.should.equals(settings.email.sender);
			email.to.should.equals(req.params.email.to);
			email.subject.should.equals(settings.email.subject);
			email.html.should.equals('body');
			callback();
		});

		youtransfer.send(req, res, function(err) {
			done();
		});
	});	

	it('should continue with erronous callback if an error occurs while retrieving settings when sending email', function(done) {

		var req = {},
			res = {}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(new Error('error'), null);
		});

		youtransfer.send(req, res, function(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});

	});	

	it('should continue with erronous callback if an error occurs while retrieving storage factory when sending email', function(done) {

		var req = {
				params: {}
			},
			res = {},
			settings = {
				general: {
					baseUrl: ''
				}
			}				

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(new Error('error'), null);
		});

		youtransfer.send(req, res, function(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});

	});	

	it('should continue with erronous callback if an error occurs while retrieving metadata when sending email', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					transporter: 'notsupported',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(new Error('error'), null);
		});

		youtransfer.send(req, res, function(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});
	});	

	it('should continue with erronous callback if an error occurs while generating the email template', function(done) {

		var req = {
				params: {
					email: {
						to: 'novalidemail'
					},
					bundle: 'bundle'
				}
			},
			res = {
				renderTemplate: function() {}
			},
			settings = {
				general: {
					baseUrl: ''
				},
				email: {
					transporter: 'notsupported',
					sender: 'sender',
					subject: 'subject'
				}
			},
			factory = {
				getJSON: function() {}
			},
			transporter = {
				sendMail: function() {}
			}

		sandbox.stub(youtransfer.settings, "get", function(callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.storageFactory, "get", function(callback) {
			callback(null, factory);
		});

		sandbox.stub(factory, "getJSON", function(token, callback) {
			token.should.equals(req.params.bundle);
			callback(null, {
				files: {
					0: {
						id: 'file'
					}
				}
			});
		});

		sandbox.stub(nodemailer, "createTransport").returns(transporter);

		sandbox.stub(res, 'renderTemplate', function(template, fields, callback) {
			callback(new Error('error'), null);
		});

		sandbox.stub(transporter, "sendMail", function(email, callback) {
			callback();
		});

		youtransfer.send(req, res, function(err) {
			should.exist(err);
			err.message.should.equals('error');
			done();
		});
	});	

});
