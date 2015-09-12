'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var fs = require("fs");
var del = require("del");
var path = require('path');
var _ = require("lodash");
var md5 = require("md5");
var mime = require('mime');
var filesize = require("filesize");
var aws = require('aws-sdk');
var zlib = require('zlib');
var nconf = require('nconf');
var nodemailer = require('nodemailer');
var smtpWellkown = require("nodemailer-wellknown");
var smtpTransport = require('nodemailer-smtp-transport');
var sendmailTransport = require('nodemailer-sendmail-transport');
var sesTransport = require('nodemailer-ses-transport');
var scheduler = require(path.join(__dirname, 'scheduler.js'));
var EventEmitter = require('events').EventEmitter;

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = new EventEmitter();

	var storageFactory = {

		get: function() {
			var settings = self.settings.get();
			return settings.StorageLocation || 'local';
		},

		local: {

			upload: function(file, context, next) {
				var basedir = path.dirname(context.path);
				fs.mkdir(basedir, function() {
					fs.readFile(file.path, function (err, data) {
						if(err) {
							next(err, context);
						} else {
							fs.writeFile(context.path, data, function(err) {
								if(err) {
									next(err, context);
								} else {
									fs.writeFile(context.jsonPath, JSON.stringify(context), 'utf-8', function(err) {
										next(err, context);
									});
								}
							});
						}
					});
				});
			},

			download: function(token, res, next) {
				try {

					var settings = self.settings.get();
					var basedir = settings.localstoragepath;
					if(!path.isAbsolute(basedir)) {
						basedir = path.resolve(nconf.get('basedir'), basedir); 
					}

					if(token) {
						token = token.trim();
						var context = require(path.join(basedir, token + '.json'));
						if(context) {
							var file = path.join(basedir, token + '.binary');
							var mimetype = mime.lookup(file) || context.type;

							res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
							res.setHeader('Content-length', context.size);
							res.setHeader('Content-type', mimetype);

							var filestream = fs.createReadStream(file);
							filestream.pipe(res);
						} else {
							throw "token not found exception";
						}
					} else {
						throw "invalid token exception";
					}
				} catch (err) {
					next(err);
				}
			},

			purge: function() {
				var settings = self.settings.get();
				var basedir = settings.localstoragepath;
				if(!path.isAbsolute(basedir)) {
					basedir = path.resolve(nconf.get('basedir'), basedir); 
				}

				fs.readdir(basedir, function(err, files) {
					_.each(files, function(file, key) {
						if(file.match(/.json$/)) {
							var context = require(path.join(basedir, file));
							if(context.expires) {
								var expires = new Date(context.expires);
								if(Date.compare(expires, new Date()) < 0) {
									del([context.path, context.jsonPath]);
								}
							}
						}
					});
				})
			}
		},

		s3: {

			upload: function(file, context, next) {
				var settings = self.settings.get();

				try {
					var s3obj = new aws.S3({
						accessKeyId: settings.S3AccessKeyId,
						secretAccessKey: settings.S3SecretAccessKey,
						region: settings.S3Region,
						sslEnabled: settings.S3SSLEnabled,
						params: {
							Bucket: settings.S3Bucket,
							Key: file.id
						}
					});
					
					var body = fs.createReadStream(file.path).pipe(zlib.createGzip());
					s3obj.upload({
						Body: body,
						Metadata: {
							json: JSON.stringify(context)
						}
					}, function(err, data) { 
						next(err, context);
					});
				} catch(err) {
					next(err, context);
				}
			},

			download: function(token, res, next) {
				var settings = self.settings.get();

				try {
					var s3obj = new aws.S3({
						accessKeyId: settings.S3AccessKeyId,
						secretAccessKey: settings.S3SecretAccessKey,
						region: settings.S3Region,
						sslEnabled: settings.S3SSLEnabled
					});

					s3obj.getObject({
						Bucket: settings.S3Bucket,
						Key: token
					}, function(err, data) {
						if(err) {
							next(err);
						} else {
							var context = JSON.parse(data.Metadata.json || {});
							res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
							res.setHeader('Content-length', context.size);
							res.send(data.Body);
						}
					});
				} catch(err) {
					next(err);
				}
			},

			purge: function() {
				var settings = self.settings.get();

				try {
					var s3obj = new aws.S3({
						accessKeyId: settings.S3AccessKeyId,
						secretAccessKey: settings.S3SecretAccessKey,
						region: settings.S3Region,
						sslEnabled: settings.S3SSLEnabled,
						params: {
							Bucket: settings.S3Bucket
						}
					});

					s3obj.listObjects(function(err, data) {
						_.each(data.Contents, function(item, key) {
							s3obj.headObject({
								Key: item.Key
							}, function(err, data) {
								var context = JSON.parse(data.Metadata.json);
								var expires = new Date(context.expires);
								if(Date.compare(expires, new Date()) < 0) {
									s3obj.deleteObject({
										Key: item.Key
									});
								};
							});
						});
					});
				} catch(err) { }
			}
		}
	};

	self.upload = function(file, next) {

		var settings = self.settings.get();
		var basedir = settings.localstoragepath;
		if(!path.isAbsolute(basedir)) { 
			basedir = path.resolve(nconf.get('basedir'), basedir);
		}

		var retention = {};
		retention[settings.retentionUnit] = parseInt(settings.retention);

		file.id = md5(file.name + (Math.random() * 1000));
		var context = {
			id: file.id,
			name: file.name,
			size: file.size,
			filesize: filesize(file.size),
			type: file.type,
			lastModifiedDate: file.lastModifiedDate,
			path: path.join(basedir, file.id + '.binary'),
			jsonPath: path.join(basedir, file.id + '.json'),
			uploaded: new Date().getTime(),
			expires: settings.retention ? new Date().add(retention).getTime() : false
		};

		storageFactory[storageFactory.get()].upload(file, context, next);
	};

	self.send = function(req, res, next) {
		var settings = self.settings.get();
		var fields = req.params;

		// Create JSON objects from url encoded file collection
		_.each(fields.files, function(item, key) {
			item = JSON.parse(decodeURIComponent(item));
			item.link = settings.baseUrl + '/download/' + item.id + '/';
			fields.files[key] = item;
		});

		var transporter = nodemailer.createTransport();

		if(settings.email.transporter == 'smtp') {
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
		} else if(settings.email.transporter == 'sendmail') {
			transporter = nodemailer.createTransport(sendmailTransport({
				path: settings.email.sendmail
			}));
		} else if(settings.email.transporter == 'ses') {
			var transporter = nodemailer.createTransport(sesTransport({
				accessKeyId: settings.email.accessKeyId,
				secretAccessKey: settings.email.secretAccessKey,
				region: settings.email.region,
				rateLimit: settings.email.rateLimit
			}));
		}

		res.renderTemplate("message.html", fields, function(err, body) {
			if(err) {
				next(err);
			} else {
				var email = {
					from: settings.email.sender,
					to: fields.email.to,
					subject: settings.email.subject,
					html: body
				}

				transporter.sendMail(email, function(err, info) {
					next(err);
				});
			}
		});
	};

	self.download = function(token, res, next) {
		storageFactory[storageFactory.get()].download(token, res, next);
	};

	self.cleanup = function() {
		storageFactory[storageFactory.get()].purge();
	};

	self.settings = {
		get: function() {
			var settings = {};
			var config = nconf.get();

			try {
				var content = fs.readFileSync('./settings.json', 'utf8');
				settings = JSON.parse(content);
			} catch(err) {}

			return _.assign(config, settings);
		},

		push: function(settings, next) {
			var current = {};
			settings = _.pick(settings, _.identity);

			try {
				var content = fs.readFileSync('./settings.json', 'utf8');
				current = JSON.parse(content);
			} catch(err) {}

			var output = _.assign(current, settings);
			fs.writeFile('./settings.json', JSON.stringify(output), function(err) {
				self.emit('settings.push', err, output);
				next(err);
			});
		}
	}

	return self;
})();

