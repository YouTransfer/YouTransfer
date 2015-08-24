'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require("fs");
var path = require('path');
var _ = require("lodash");
var md5 = require("md5");
var mime = require('mime');
var filesize = require("filesize");
var aws = require('aws-sdk');
var zlib = require('zlib');
var nconf = require('nconf');
var nodemailer = require('nodemailer');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = {};

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

					var context = require(path.join(basedir, token + '.json'));
					if(context) {
						var file = path.join(basedir, token + '.binary');
						var mimetype = mime.lookup(file) || context.type;

						res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
						res.setHeader('Content-length', context.size);
						res.setHeader('Content-type', mimetype);

						var filestream = fs.createReadStream(file);
						filestream.pipe(res);
					}
				} catch (err) {
					next(err);
				}
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
			}
		}
	};

	self.upload = function(file, next) {

		var settings = self.settings.get();
		var basedir = settings.localstoragepath;
		if(!path.isAbsolute(basedir)) { 
			basedir = path.resolve(nconf.get('basedir'), basedir);
		}

		file.id = md5(file.name + (Math.random() * 1000));
		var context = {
			id: file.id,
			name: file.name,
			size: file.size,
			filesize: filesize(file.size),
			type: file.type,
			lastModifiedDate: file.lastModifiedDate,
			path: path.join(basedir, file.id + '.binary'),
			jsonPath: path.join(basedir, file.id + '.json')
		};

		storageFactory[storageFactory.get()].upload(file, context, next);
	};

	self.send = function(req, res, next) {
		var settings = self.settings.get();
		var fields = req.params;

		var transporter = nodemailer.createTransport();
		res.renderTemplate("message.html", fields, function(err, body) {
			if(err) {
				next(err);
			} else {
				var email = {
					from: fields.email.from,
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
			fs.writeFile('./settings.json', JSON.stringify(output), next);
		}
	}

	return self;
})();

