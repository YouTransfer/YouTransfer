'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require("fs");
var path = require('path');
var _ = require("lodash");
var nconf = require('nconf');
var EventEmitter = require('events').EventEmitter;

// ------------------------------------------------------------------------------------------ Module definition

module.exports = (function() {

	var self = new EventEmitter();

	self.get = function(next) {
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
	}

	self.push = function(settings, next) {
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

	return self;
})();