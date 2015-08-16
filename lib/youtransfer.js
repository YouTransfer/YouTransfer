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
var _ = require("lodash");
var md5 = require("md5");
var mime = require('mime');
var filesize = require("filesize");

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = {};

	self.upload = function(file, next) {
		file.id = md5(file.name + (Math.random() * 1000));
		var context = {
			id: file.id,
			name: file.name,
			size: file.size,
			filesize: filesize(file.size),
			type: file.type,
			lastModifiedDate: file.lastModifiedDate,
			path: './uploads/' + file.id + '.binary',
			jsonPath: './uploads/' + file.id + '.json'
		};

		fs.mkdir('./uploads', function() {
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

	self.download = function(token, res) {
		try {
			var context = require('../uploads/' + token + '.json');
			if(context) {
				var file = __dirname + '/../uploads/' + token + '.binary';
				var mimetype = mime.lookup(file) || context.type;

				res.setHeader('Content-disposition', 'attachment; filename="' + context.name + '"');
				res.setHeader('Content-length', context.size);
				res.setHeader('Content-type', mimetype);

				var filestream = fs.createReadStream(file);
				filestream.pipe(res);
			}
		} catch (exp) { 
			res.redirect("/");
		}		
	};

	self.pushSettings = function(settings, next) {
		var current = JSON.parse(fs.readFileSync('./settings.json', 'utf8')) || {};
		var output = _.assign(_.pick(current, _.identity), settings);
		fs.writeFile('./settings.json', JSON.stringify(output), next);
	};

	return self;
})();

