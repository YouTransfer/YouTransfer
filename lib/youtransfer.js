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
var archiver = require('archiver');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = new EventEmitter();

	var storageFactory = {

		get: function(next) {
			self.settings.get(function(err, settings) {
				next(settings.StorageLocation || 'local');
			});
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

			bundle: function(bundle, next) {
				var basedir = path.dirname(bundle.path);
				fs.mkdir(basedir, function() {
					fs.writeFile(bundle.path, JSON.stringify(bundle), 'utf-8', function(err) {
						next(err);
					});
				});
			},

			archive: function(token, res, next) {
				try {
					self.settings.get(function(err, settings) {
						var basedir = settings.localstoragepath;
						if(token) {
							var bundle = require(path.join(basedir, token + '.json'));
							if(bundle) {

								res.setHeader('Content-disposition', 'attachment; filename="bundle.zip"');
								res.setHeader('Content-type', 'application/octet-stream');

								var archive = archiver('zip');
								_.each(bundle.files, function(file, key) {
									archive.file(path.join(basedir, file.id + '.binary'), { name: file.name });
								});

								archive.pipe(res);
								archive.finalize();
							} else {
								throw 'invalid bundle identifier';
							}
						} else {
							throw 'bundle identifier unknown';
						}
					});
				} catch(err) {
					next(err);
				}
			},

			download: function(token, res, next) {
				try {
					self.settings.get(function(err, settings) {
						var basedir = settings.localstoragepath;
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
					});
				} catch (err) {
					next(err);
				}
			},

			purge: function() {
				self.settings.get(function(err, settings) {
					var basedir = settings.localstoragepath;
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
				});
			}
		},

		s3: {

			upload: function(file, context, next) {
				self.settings.get(function(err, settings) {
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
				});
			},

			bundle: function(bundle, next) {
				self.settings.get(function(err, settings) {
					try {
						var s3obj = new aws.S3({
							accessKeyId: settings.S3AccessKeyId,
							secretAccessKey: settings.S3SecretAccessKey,
							region: settings.S3Region,
							sslEnabled: settings.S3SSLEnabled,
							params: {
								Bucket: settings.S3Bucket,
								Key: bundle.id,
							}
						});

						s3obj.upload({
							Body: JSON.stringify(bundle),
							Metadata: {
								json: JSON.stringify(bundle)
							}
						}, function(err, data) { 
							next(err);
						});
					} catch(err) {
						next(err);
					}
				});
			},

			archive: function(token, res, next) {
				self.settings.get(function(err, settings) {
					try {
						if(token) {
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
									var bundle = JSON.parse(data.Body);
									if(bundle) {
										res.setHeader('Content-disposition', 'attachment; filename="bundle.zip"');
										res.setHeader('Content-type', 'application/octet-stream');
										var archive = archiver('zip');

										var completed = _.after(bundle.files.length, function() {
											archive.pipe(res);
											archive.finalize();
										});

										_.each(bundle.files, function(file, key) {
											var gunzip = zlib.createGunzip();
											archive.append(s3obj.getObject({
													Bucket: settings.S3Bucket,
													Key: file.id
											}).createReadStream().pipe(gunzip), { name: file.name});
											completed();											
										});
									} else {
										throw 'invalid bundle identifier';
									}
								}
							});
						} else {
							throw 'invalid token exception'
						}
					} catch(err) {
						next(err);
					}
				});
			},

			download: function(token, res, next) {
				self.settings.get(function(err, settings) {
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
				});
			},

			purge: function() {
				self.settings.get(function(err, settings) {
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
				});
			}
		}
	};

	self.upload = function(file, bundle, next) {
		self.settings.get(function(err, settings) {
			var basedir = settings.localstoragepath;
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
				expires: settings.retention ? new Date().add(retention).getTime() : false,
				bundle: bundle
			};

			storageFactory.get(function(factory) {
				storageFactory[factory].upload(file, context, next);
			});
		});
	};

	self.bundle = function(bundle, next) {
		self.settings.get(function(err, settings) {
			var basedir = settings.localstoragepath;
			var retention = {};
			retention[settings.retentionUnit] = parseInt(settings.retention);

			var context = _.assign({
				path: path.join(basedir, bundle.id + '.json'),
				uploaded: new Date().getTime(),
				expires: settings.retention ? new Date().add(retention).getTime() : false,
			}, bundle);

			storageFactory.get(function(factory) {
				storageFactory[factory].bundle(context, next);
			});
		});
	}

	self.send = function(req, res, next) {
		self.settings.get(function(err, settings) {
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
		});
	};

	self.download = function(token, res, next) {
		storageFactory.get(function(factory) {
			storageFactory[factory].download(token, res, next);
		});
	};

	self.archive = function(token, res, next) {
		storageFactory.get(function(factory) {
			storageFactory[factory].archive(token, res, next);
		});
	};

	self.cleanup = function() {
		storageFactory.get(function(factory) {
			storageFactory[factory].purge();
		});
	};

	self.settings = {
		get: function(next) {
			fs.readFile('./settings.json', 'utf8', function(err, content) {
				if(err) {
					next(err, {});
				} else {
					try {
						var config = nconf.get();
						var settings = JSON.parse(content);
						var output = _.assign(config, settings);

						if(!path.isAbsolute(output.localstoragepath)) {
							output.localstoragepath = path.resolve(nconf.get('basedir'), output.localstoragepath);
						}

						next(null, output);
					} catch(err) {
						next(err, {});
					}
				}
			});
		},

		push: function(settings, next) {
			var current = {};
			settings = _.pick(settings, _.identity);

			fs.readFile('./settings.json', 'utf8', function(err, content) {
				if(err) {
					next(err);
				} else {
					try {
						var current = JSON.parse(content);
						var output = _.assign(current, settings);
						fs.writeFile('./settings.json', JSON.stringify(output), function(err) {
							self.emit('settings.push', err, output);
							next(err);
						});
					} catch(err) {
						next(err);
					}
				};
			});
		}
	}

	return self;
})();

