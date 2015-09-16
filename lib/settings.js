'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require("fs");
var path = require('path');
var _ = require("lodash");
var nconf = require('nconf');
var EventEmitter = require('events').EventEmitter;

// ------------------------------------------------------------------------------------------ Module definition

module.exports = function(opt) {
	return new Settings(opt);
}

function Settings(opt) {
	this.options = opt || {};

	if(_.isString(this.options)) {
		this.options = {
			path: this.options
		}
	} else if(_.isObject(this.options)) {
		this.options = _.assign({
			path: './settings.json',
			encoding: 'utf-8'
		}, opt);
	} else {
		throw "Invalid options provided";
	}
};

Settings.prototype = new EventEmitter;

Settings.prototype.get = function(next) {
	var self = this;
	fs.readFile(self.options.path, self.options.encoding, function(err, content) {
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
};

Settings.prototype.push = function(settings, next) {
	var self = this;
	var current = {};
	settings = _.pick(settings, _.identity);

	fs.readFile(self.options.path, self.options.encoding, function(err, content) {
		if(err) {
			next(err);
		} else {
			try {
				var current = JSON.parse(content);
				var output = _.assign(current, settings);
				fs.writeFile(self.options.path, JSON.stringify(output), self.options.encoding, function(err) {
					self.emit('settings.push', err, output);
					next(err);
				});
			} catch(err) {
				next(err);
			}
		};
	});
};