'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var fs = require('fs');
var del = require('del');
var path = require('path');
var mime = require('mime');
var _ = require('lodash');
var archiver = require('archiver');
var crypto = require('crypto');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(options) {
	return new LocalFileStorage(options);
};

// ------------------------------------------------------------------------------------------ Module definition

function LocalFileStorage(options) {
	options = options || {};
	this.options = options;

	if(_.isObject(this.options)) {

		var storage = options.storage || {};
		var security = options.security || {};

		this.localstoragepath = storage.localstoragepath || __dirname;
		this.encryptionEnabled = security.encryptionEnabled || false;
		this.encryptionKey = security.encryptionKey;
	} else {
		throw new Error('Invalid options provided');
	}
}

LocalFileStorage.prototype.getJSON = function(token, next) {
	var file = path.join(this.localstoragepath, token + '.json');
	fs.readFile(file, function(err, data) {
		if(!err) {
			try {
				var value = JSON.parse(data);
				next(null, value);
			} catch(err) {
				next(err);
			}
		} else {
			next(err);
		}
	});
};

LocalFileStorage.prototype.upload = function(file, context, next) {
	var self = this;
	var basedir = path.dirname(context.path);
	fs.mkdir(basedir, function() {

		var readStream = fs.createReadStream(file.path);
		var writeStream = fs.createWriteStream(context.path);

		readStream.on('error', next);
		writeStream.on('error', next);
		writeStream.on('finish', function() {
			fs.writeFile(context.jsonPath, JSON.stringify(context), 'utf8', function(err) {
				next(err, context);
			});
		});

		if(self.encryptionEnabled && self.encryptionKey) {
			var cipher = crypto.createCipher('aes-256-ctr', self.encryptionKey);
			readStream.pipe(cipher)
					  .pipe(writeStream);
		} else {
			readStream.pipe(writeStream);
		}

	});
};

LocalFileStorage.prototype.bundle = function(bundle, next) {
	var basedir = path.dirname(bundle.path);
	fs.mkdir(basedir, function() {
		fs.writeFile(bundle.path, JSON.stringify(bundle), 'utf8', function(err) {
			next(err);
		});
	});
};

LocalFileStorage.prototype.archive = function(token, res, next) {
	try {
		var self = this;
		var basedir = this.localstoragepath;
		if(token) {

			var bundlePath = path.join(basedir, token + '.json');
			if (bundlePath.indexOf(basedir) !== 0) {
				throw new Error('Invalid token provided');
			}

			fs.readFile(bundlePath, 'utf8', function(err, data) {
				try {
					if(err) {
						throw err;
					} else {
						var bundle = JSON.parse(data);

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

								var filePath = path.join(basedir, file.id + '.binary');
								if (filePath.indexOf(basedir) !== 0) {
									throw new Error('Invalid token provided');
								}

								if(self.encryptionEnabled && self.encryptionKey) {
									fs.readFile(filePath, function(err, data) {
										var decipher = crypto.createDecipher('aes-256-ctr', self.encryptionKey);
										var buffer = Buffer.concat([decipher.update(data) , decipher.final()]);
										archive.append(buffer, { name: file.name });
										completed();
									});
								} else {
									archive.file(filePath, { name: file.name });
									completed();
								}

							});
						} else {
							throw new Error('Invalid bundle data');
						}
					}
				} catch(err) {
					next(err);
				}
			});
		} else {
			throw new Error('Bundle identifier unknown');
		}
	} catch(err) {
		next(err);
	}
};

LocalFileStorage.prototype.download = function(token, res, next) {
	try {
		var self = this;
		var basedir = this.localstoragepath;
		if(token) {

			token = token.trim();
			var tokenPath = path.join(basedir, token + '.json');
			if (tokenPath.indexOf(basedir) !== 0) {
				throw new Error('Invalid token provided');
			}

			fs.readFile(tokenPath, 'utf8', function(err, data) {
				try {
					if(err) {
						throw err;
					}

					var context = JSON.parse(data);
					var file = path.join(basedir, token + '.binary');
					var mimetype = mime.lookup(file) || context.type;

					if(context.expires) {
						var expires = new Date(context.expires);
						if(Date.compare(expires, new Date()) < 0) {
							throw new Error('The requested file is no longer available.');
						}
					}

					res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
					res.setHeader('Content-length', context.size);
					res.setHeader('Content-type', mimetype);
					res.on('finish', next);

					var filestream = fs.createReadStream(file);
					if(self.encryptionEnabled && self.encryptionKey) {
						var decipher = crypto.createDecipher('aes-256-ctr', self.encryptionKey);
						filestream.pipe(decipher)
								  .pipe(res);
					} else {
						filestream.pipe(res);
					}

				} catch(err) {
					next(err);
				}
			});
		} else {
			throw new Error('invalid token exception');
		}
	} catch (err) {
		next(err);
	}
};

LocalFileStorage.prototype.purge = function(next) {
	var basedir = this.localstoragepath;
	fs.readdir(basedir, function(err, files) {
		var filesToDelete = [];
		_.each(files, function(file) {
			if(file.match(/.json$/)) {
				fs.readFile(path.join(basedir, file), 'utf8', function(err, data) {
					var context = JSON.parse(data);
					if(context.expires) {
						var expires = new Date(context.expires);
						if(Date.compare(expires, new Date()) < 0) {
							filesToDelete.push(context.path, context.jsonPath);
						}
					}
				});
			}
		});

		del(filesToDelete, function(err) {
			next(err, filesToDelete);
		});
	});
};
