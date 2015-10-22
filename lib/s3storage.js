'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var fs = require('fs');
var _ = require('lodash');
var zlib = require('zlib');
var aws = require('aws-sdk');
var archiver = require('archiver');
var validator = require('validator');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(options) {
	return new S3Storage(options);
};

// ------------------------------------------------------------------------------------------ Module definition

function S3Storage(options) {
	this.options = options;

	if(_.isObject(this.options)) {
		var storage = this.options.storage || {};
		this.s3obj = new aws.S3({
			accessKeyId: storage.S3AccessKeyId,
			secretAccessKey: storage.S3SecretAccessKey,
			region: storage.S3Region,
			sslEnabled: storage.S3SSLEnabled,
			params: {
				Bucket: storage.S3Bucket
			}
		});
	} else {
		throw 'Invalid options provided';
	}
}

S3Storage.prototype.getJSON = function(token, next) {
	try {
		var s3obj = this.s3obj;
		s3obj.getObject({
			Key: token
		}, function(err, data) {
			if(!err) {
				var value;
				if(validator.isUUID(token)) {
					value = JSON.parse(data.Body);
				} else {
					value = JSON.parse(data.Metadata.json);
				}
				next(err, value);
			} else {
				throw err;
			}
		});
	} catch(err) {
		next(err);
	}
};

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
		}, function(err) {
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
			Body: JSON.stringify(bundle)
		}, function(err) {
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

					if(bundle.expires) {
						var expires = new Date(bundle.expires);
						if(Date.compare(expires, new Date()) < 0) {
							throw new Error('The requested bundle is no longer available.');
						}
					}

					if(bundle.files) {
						res.setHeader('Content-disposition', 'attachment; filename="bundle.zip"');
						res.setHeader('Content-type', 'application/octet-stream');
						var archive = archiver('zip');
						archive.on('finish', next);

						var completed = _.after(bundle.files.length, function() {
							archive.pipe(res);
							archive.finalize();
						});

						_.each(bundle.files, function(file) {
							var gunzip = zlib.createGunzip();
							archive.append(s3obj.getObject({
								Key: file.id
							}).createReadStream().pipe(gunzip), { name: file.name});
							completed();
						});
					} else {
						throw 'Invalid bundle data';
					}
				}
			});
		} else {
			throw 'Bundle identifier unknown';
		}
	} catch(err) {
		next(err);
	}
};

S3Storage.prototype.download = function(token, res, next) {
	try {
		if(token) {
			var s3obj = this.s3obj;
			s3obj.getObject({
				Key: token
			}, function(err, data) {
				if(err) {
					throw err;
				} else {
					var context = JSON.parse(data.Metadata.json);

					if(context.expires) {
						var expires = new Date(context.expires);
						if(Date.compare(expires, new Date()) < 0) {
							throw new Error('The requested file is no longer available.');
						}
					}

					res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
					res.setHeader('Content-type', 'application/octet-stream');
					res.setHeader('Content-length', context.size);
					zlib.gunzip(data.Body, function(err, unzipped) {
						res.on('finish', next);
						res.send(unzipped);
					});
				}
			});
		} else {
			throw 'invalid token exception';
		}
	} catch(err) {
		next(err);
	}
};

S3Storage.prototype.purge = function(next) {
	try {
		var s3obj = this.s3obj;
		var filesToDelete = [];
		s3obj.listObjects(function(err, data) {

			var completed = _.after(data.Contents.length, function() {
				next(null, filesToDelete);
			});

			_.each(data.Contents, function(item) {
				s3obj.headObject({
					Key: item.Key
				}, function(err, data) {
					if(!err) {
						var context = JSON.parse(data.Metadata.json);
						var expires = new Date(context.expires);
						if(Date.compare(expires, new Date()) < 0) {
							s3obj.deleteObject({
								Key: item.Key
							}, function() {
								filesToDelete.push(context.name);
								completed();
							});
						} else {
							completed();
						}
					} else {
						completed();
					}
				});
			});
		});
	} catch(err) {
		next(err, filesToDelete);
	}
};
