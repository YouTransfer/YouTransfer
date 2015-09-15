'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var fs = require("fs");
var del = require("del");
var path = require('path');
var mime = require('mime');
var _ = require("lodash");
var archiver = require('archiver');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = function(options) {
	return new LocalFileStorage(options);
}

function LocalFileStorage(options) {
	options = options || {};
	this.options = options;

	if(_.isString(this.options)) {
		this.localstoragepath = this.options;
	} else if(_.isObject(this.options)) {
		this.localstoragepath = options.localstoragepath || __dirname;
	} else {
		throw "Invalid options provided";
	}
}

LocalFileStorage.prototype.upload = function(file, context, next) {
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
};

LocalFileStorage.prototype.bundle = function(bundle, next) {
	var basedir = path.dirname(bundle.path);
	fs.mkdir(basedir, function() {
		fs.writeFile(bundle.path, JSON.stringify(bundle), 'utf-8', function(err) {
			next(err);
		});
	});
};

LocalFileStorage.prototype.archive = function(token, res, next) {
	try {
		var basedir = this.localstoragepath;
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
				throw 'Invalid bundle identifier';
			}
		} else {
			throw 'Bundle identifier unknown';
		}
	} catch(err) {
		next(err);
	}
};

LocalFileStorage.prototype.download = function(token, res, next) {
	try {
		var basedir = this.localstoragepath;
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
};

LocalFileStorage.prototype.purge = function() {
	var basedir = this.localstoragepath;
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
	});
};
