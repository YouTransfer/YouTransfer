'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var fs = require("fs");
var _ = require("lodash");
var zlib = require('zlib');
var aws = require('aws-sdk');
var archiver = require('archiver');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(options) {
	return new S3Storage(options);
}

// ------------------------------------------------------------------------------------------ Module definition

function S3Storage(options) {
	options = options || {};
	this.options = options;

	if(_.isObject(this.options)) {
		this.s3obj = new aws.S3({
			accessKeyId: this.options.S3AccessKeyId,
			secretAccessKey: this.options.S3SecretAccessKey,
			region: this.options.S3Region,
			sslEnabled: this.options.S3SSLEnabled,
			params: {
				Bucket: this.options.S3Bucket
			}
		});
	} else {
		throw "Invalid options provided";
	}
}


S3Storage.prototype.upload = function(file, context, next) {
	try {
		var s3obj = this.s3obj;
		var body = fs.createReadStream(file.path).pipe(zlib.createGzip());
		s3obj.upload({
			Key: file.id,
			Body: body,
			Metadata: {
				json: JSON.stringify(context)
			},
		}, function(err, data) { 
			next(err, context);
		});
	} catch(err) {
		next(err, context);
	}
};

S3Storage.prototype.bundle = function(bundle, next) {
	try {
		var s3obj = this.s3obj;
		s3obj.upload({
			Key: bundle.id,
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
};

S3Storage.prototype.archive = function(token, res, next) {
	try {
		if(token) {
			var s3obj = this.s3obj;
			s3obj.getObject({
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
},

S3Storage.prototype.download = function(token, res, next) {
	try {
		var s3obj = this.s3obj;
		s3obj.getObject({
			Key: token
		}, function(err, data) {
			if(err) {
				throw err;
			} else {
				var context = JSON.parse(data.Metadata.json || {});
				res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
				res.setHeader('Content-type', 'application/octet-stream');
				res.setHeader('Content-length', context.size);
				zlib.gunzip(data.Body, function(err, unzipped) {
					res.send(unzipped);
				});
			}
		});
	} catch(err) {
		next(err);
	}
},

S3Storage.prototype.purge = function() {
	try {
		var s3obj = this.s3obj;
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
};
