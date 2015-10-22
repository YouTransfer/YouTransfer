'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var nconf = require('nconf');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var crypto = require('crypto-js/sha256');
var cache = require('node-cache');

// ------------------------------------------------------------------------------------------ Module definition

function Settings(opt) {
	EventEmitter.call(this);
	this.cache = new cache({ checkperiod: 0 });
	this.options = opt || {};

	if(_.isString(this.options)) {
	 	this.options = {
			path: this.options
		};
	} else if(_.isObject(this.options)) {
		this.options = _.assign({
			config: './config.json',
			path: './settings.json',
			encoding: 'utf8'
		}, opt);
	} else {
		throw 'Invalid options provided';
	}
}

util.inherits(Settings, EventEmitter);

Settings.prototype.getInstance = function(opt) {
	return new Settings(opt);
};

Settings.prototype.defaults = function(next) {
	var self = this;
	self.cache.get('defaults', function(err, cached) {
		if(_.isUndefined(cached)) {
			fs.readFile(self.options.config, self.options.encoding, function(err, content) {
				try {
					var env = nconf.get();
					var config = content ? JSON.parse(content) : {};
					var defaults = _.defaultsDeep(config, env);
					next(null, defaults);
				} catch(err) {
					next(err, {});
				}
			});
		} else {
			next(null, cached);
		}
	});
};

Settings.prototype.get = function(next) {
	var self = this;

	self.cache.get('settings', function(err, cached) {
		if(_.isUndefined(cached)) {
			self.defaults(function(err, defaults) {
				fs.readFile(self.options.path, self.options.encoding, function(err, content) {
					try {
						var settings = content ? JSON.parse(content) : {};
						var output = _.defaultsDeep(settings, defaults);

						// Fix the local storage path by resolving relative paths
						if(output.storage.localstoragepath && !path.isAbsolute(output.storage.localstoragepath)) {
							var basedir = output.basedir || path.join(__dirname, '../');
							output.storage.localstoragepath = path.resolve(basedir, output.storage.localstoragepath);
						}

						// OVERRIDE SETTINGS WITH KNOWN ENVIRONMENT VARIABLES (if set)
						// FOR AN OVERVIEW OF SUPPORTED ENVIRONMENT VARIABLES, PLEASE REFER TO THE WIKI
						output.security = output.security || {};
						output.security.encryptionKey = nconf.get('ENCRYPTIONKEY') || output.security.encryptionKey;
						output.security.encryptionKeyMethod = (nconf.get('ENCRYPTIONKEY') ? 'env' : output.security.encryptionKeyMethod);

						self.cache.set('settings', output, 300);
						next(null, output);
					} catch(err) {
						next(err, {});
					}
				});
			});
		} else {
			next(null, cached);
		}
	});
};

Settings.prototype.push = function(settings, next) {
	var self = this;

	fs.readFile(self.options.path, self.options.encoding, function(err, content) {
		try {
			var config = require('../config.json');
			var current = content ? JSON.parse(content) : {};
			var defaults = _.defaultsDeep(current, config);

			// Call fixBooleanValues() method to deal with checkboxes
			settings = self._fixBooleanValues(defaults, settings);
			var output = _.defaultsDeep(settings, defaults);

			var security = output.security || {};
			var salt = nconf.get('ENCRYPTIONKEY') || security.encryptionKey;
			output = self._hashPasswords(output, salt);

			// Ensure that settings have not been finalised
			if(!output.state.force && defaults.state.finalised) {
				throw new Error('SETTINGS_FINALISED');
			} else {
				delete output.state.force;
			}

			fs.writeFile(self.options.path, JSON.stringify(output), self.options.encoding, function(err) {
				self.cache.del('settings');
				self.emit('settings.push', err, output);
				next(err);
			});
		} catch(err) {
			next(err);
		}
	});
};

Settings.prototype.finalise = function(code, next) {

	this.push({
		state: {
			unlockCode: code,
			finalised: true,
			force: true
		}
	}, next);

};

Settings.prototype.unlock = function(code, next) {
	var self = this;
	self.get(function(err, settings) {
		try {
			if(err) {
				throw err;
			} else if(settings.state.unlockCode !== code) {
				throw new Error('INVALID_CODE');
			} else {
				self.push({
					state: {
						finalised: false,
						unlockCode: null,
						force: true
					}
				}, next);
			}
		} catch(err) {
			next(err);
		}
	});
};

Settings.prototype._fixBooleanValues = function(src, dest) {
	var self = this;
	_.forOwn(src, function(value, key) {
		if(_.isObject(value) && dest[key]) {
			dest[key] = self._fixBooleanValues(value, dest[key]);
		} else if(_.isBoolean(value) || value === 'true') {
			if(_.isUndefined(dest[key])) {
				dest[key] = false;
			}
		}
	});
	return dest;
};

Settings.prototype._hashPasswords = function(settings, salt) {
	var self = this;
	if(_.isUndefined(salt)) {
		salt = '';
	}
	
	_.forOwn(settings, function(value, key) {
		if(_.isObject(value)) {
			settings[key] = self._hashPasswords(value, salt);
		} else {
			if(key.match(/password/i)) {
				settings[key] = crypto(value + salt).toString();
			}
		}
	});
	return settings;
};

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = new Settings();
