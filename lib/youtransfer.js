'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var path = require('path');
var _ = require('lodash');
var crypto = require('crypto');
var filesize = require('filesize');
var nodemailer = require('nodemailer');
var smtpWellkown = require('nodemailer-wellknown');
var smtpTransport = require('nodemailer-smtp-transport');
var sendmailTransport = require('nodemailer-sendmail-transport');
var sesTransport = require('nodemailer-ses-transport');

var scheduler = require('./scheduler');
var localstorage = require('./localstorage');
var s3storage = require('./s3storage');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = {};
	self.settings = require('./settings');
	self.log = require('./logger')('youtransfer');

	// Schedule background jobs
	self.initialize = function() {
		self.settings.get(function(err, settings) {
			if(!err) {
				if(settings.general.schedulerEnabled) {
					self.log.info('Scheduled cleanup of expired files');
					scheduler.add('cleanup', settings.general.cleanupSchedule, self.cleanup);
				}

				self.settings.on('settings.push', function(err, data) {
					if(data.general.schedulerEnabled) {
						self.log.info('(Re)scheduled cleanup of expired files');
						scheduler.reschedule('cleanup', data.general.cleanupSchedule, self.cleanup);
					} else {
						self.log.info('Disabled cleanup schedule');
						scheduler.remove('cleanup');
					}
				});
			}
		});
	};

	self.storageFactory = {
		get: function(next) {
			self.settings.get(function(err, settings) {
				var provider = settings.storage.location || 'local';
				if(provider === 'local') {
					next(null, localstorage(settings.storage));
				} else if (provider === 's3') {
					next(null, s3storage(settings.storage));
				} else {
					next(new Error('Storage provider not supported'));
				}
			});
		},
	};

	self.transporter = {
		get: function(next) {
			self.settings.get(function(err, settings) {
				var transporter = nodemailer.createTransport();
				if(settings.email.transporter === 'smtp') {
					if(smtpWellkown(settings.email.service)) {
						transporter = nodemailer.createTransport(smtpTransport({
							service: settings.email.service,
							auth: {
								user: settings.email.username,
								pass: settings.email.password
							}
						}));
					} else {
						transporter = nodemailer.createTransport(smtpTransport({
							host: settings.email.host,
							port: settings.email.port,
							secure: settings.email.secure,
							auth: {
								user: settings.email.username,
								pass: settings.email.password
							}
						}));
					}
				} else if(settings.email.transporter === 'sendmail') {
					transporter = nodemailer.createTransport(sendmailTransport({
						path: settings.email.sendmailPath
					}));
				} else if(settings.email.transporter === 'ses') {
					transporter = nodemailer.createTransport(sesTransport({
						accessKeyId: settings.email.accessKeyId,
						secretAccessKey: settings.email.secretAccessKey,
						region: settings.email.region,
						rateLimit: settings.email.rateLimit
					}));
				}

				next(transporter);
			});
		}
	};

	self.upload = function(file, bundle, next) {
		self.settings.get(function(err, settings) {
			var basedir = settings.storage.localstoragepath;
			var retention = {};
			retention[settings.storage.retentionUnit] = parseInt(settings.storage.retention);

			file.id = crypto.randomBytes(16).toString('hex');
			var context = {
				id: file.id,
				name: file.name,
				size: file.size,
				filesize: filesize(file.size),
				type: file.type,
				lastModifiedDate: file.lastModifiedDate,
				link: settings.general.baseUrl + '/download/' + file.id + '/',
				path: path.join(basedir, file.id + '.binary'),
				jsonPath: path.join(basedir, file.id + '.json'),
				uploaded: new Date().getTime(),
				expires: settings.storage.retention ? new Date().add(retention).getTime() : false,
				bundle: bundle.id
			};

			if(context.size > (settings.dropzone.maxFilesize * 1024 * 1024)) {
				next(new Error('File "' + context.name + '" is too big (' + context.filesize + '). Max filesize: ' + settings.dropzone.maxFilesize + 'MiB.'), context);
			} else {
				self.storageFactory.get(function(err, factory) {
					factory.upload(file, context, next);
				});
			}
		});
	};

	self.bundle = function(bundle, next) {
		self.settings.get(function(err, settings) {
			var basedir = settings.storage.localstoragepath;
			var retention = {};
			retention[settings.storage.retentionUnit] = parseInt(settings.storage.retention);

			var context = _.assign({
				path: path.join(basedir, bundle.id + '.json'),
				uploaded: new Date().getTime(),
				expires: settings.storage.retention ? new Date().add(retention).getTime() : false,
			}, bundle);

			self.storageFactory.get(function(err, factory) {
				factory.bundle(context, next);
			});
		});
	};

	self.download = function(token, res, next) {
		self.storageFactory.get(function(err, factory) {
			factory.download(token, res, next);
		});
	};

	self.archive = function(token, res, next) {
		self.storageFactory.get(function(err, factory) {
			factory.archive(token, res, next);
		});	
	};

	self.cleanup = function() {
		self.storageFactory.get(function(err, factory) {
			factory.purge(function(err, filesToDelete) {
				if(err) {
					self.log.error('An error occurred while removing expired files: ' + err.message);
				} else {
					self.log.info('The scheduled cleanup job has removed ' + filesToDelete.length + ' files.');
				}
			});
		});
	};

	self.send = function(req, res, next) {
		self.settings.get(function(err, settings) {
			if(!err) {
				var fields = _.clone(req.params);
				fields.baseUrl = settings.general.baseUrl;
				fields.bundle = {
					id: req.params.bundle,
					link: settings.general.baseUrl + '/bundle/' + req.params.bundle
				};

				self.storageFactory.get(function(err, factory) {
					if(!err) {
						factory.getJSON(fields.bundle.id, function(err, bundle) {
							if(!err) {
								fields.files = bundle.files;
								res.renderTemplate('message.html', fields, function(err, body) {
									if(!err) {
										var email = {
											from: settings.email.sender,
											to: fields.email.to,
											subject: settings.email.subject,
											html: body
										};

										if(settings.email.sendCopy) {
											email.cc = settings.email.sender;
										}

										self.transporter.get(function(transporter) {
											transporter.sendMail(email, function(err) {
												next(err);
											});
										});
									} else {
										next(err);
									}
								});
							} else {
								next(err);
							}
						});
					} else {
						next(err);
					}
				});
			} else {
				next(err);
			}
		});
	};

	self.initialize();
	return self;
})();
