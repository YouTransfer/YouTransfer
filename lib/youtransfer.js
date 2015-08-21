'use strict';

// ------------------------------------------------------------------------------------------ Configuration

// Load configuration
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: 'local.json' })
	 .file({ file: 'config.json' });

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require("fs");
var path = require('path');
var _ = require("lodash");
var md5 = require("md5");
var mime = require('mime');
var filesize = require("filesize");
var aws = require('aws-sdk');
var zlib = require('zlib');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = {};
	nconf.set('basedir', path.resolve(__dirname, '../'));

	var storageFactory = {

		get: function() {
			var settings = self.settings.get();
			return settings.StorageLocation || 'local';
		},

		local: {

			upload: function(file, context, next) {
				var basedir = path.basename(context.path);

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
					var basedir = settings.localstoragepath || 	path.join(nconf.get('basedir'), 'uploads');
					if(path.isRelative(basedir)) { 
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
						region: settings.S3Region || 'us-east-1',
						sslEnabled: settings.S3SSLEnabled || true,
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
						region: settings.S3Region || 'us-east-1',
						sslEnabled: settings.S3SSLEnabled || true
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
		var basedir = settings.localstoragepath || 	path.join(nconf.get('basedir'), 'uploads');
		if(path.isRelative(basedir)) { 
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

	self.download = function(token, res, next) {
		storageFactory[storageFactory.get()].download(token, res, next);
	};

	self.settings = {
		get: function() {
			return JSON.parse(fs.readFileSync('./settings.json', 'utf8')) || {};
		},

		push: function(settings, next) {
			settings = _.pick(settings, _.identity);
			var current = self.settings.get();
			var output = _.assign(current, settings);
			fs.writeFile('./settings.json', JSON.stringify(output), next);
		}
	}

	return self;
})();

