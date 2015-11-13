'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require('fs');
var _ = require('lodash');
var Cache = require('node-cache');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(options) {
	return new Persist(options);
};

// ------------------------------------------------------------------------------------------ Module Definition

function Persist(options) {
	var self = this;

	self._caches = {};
	self.path = options.path || './persist.json';
	self.load();
};

Persist.prototype.get = function(key, scope) {
	return this.cache(scope).get(key);
};

Persist.prototype.set = function(key, value, scope) {
	return this.cache(scope).set(key, value);
};

Persist.prototype.del = function(key, scope) {
	return this.cache(scope).del(key);
};

Persist.prototype.exists = function(key, scope) {
	return (this.cache(scope).data[key] ? true : false);
};

Persist.prototype.flush = function(scope) {
	if(scope) {
		return this.cache(scope).flushAll();
	} else {
		self._caches = {};
		this.save();
		return true;
	}
};

Persist.prototype.export = function(scope) {
	var self = this;
	var output = [];
	self.cache(scope).keys().forEach(function(key) {
		output.push(self.cache(scope).get(key));
	});
	return output;
}

Persist.prototype.load = function(callback) {
	var self = this;
	callback = callback || function() {};

	fs.readFile(self.path, 'utf8', function(err, content) {
		if(!err) {
			var caches = JSON.parse(content);

			self._caches = {};
			_.forOwn(caches, function(data, scope) {
				_.forOwn(data, function(value, key) {
					self.cache(scope)
						.quiet()
						.set(key, value);
				});
			});

			callback();
		} else if(err.code == 'ENOENT') {
			// File does not exist, start with empty cache
			self._caches = {};
			callback();
		} else {
			throw err;
		}
	});
};

Persist.prototype.save = function() {
	var self = this;
	self.suppressEvents = true;

	var output = {};
	_.forOwn(self._caches, function(cache, scope) {
		output[scope] = {};
		cache.keys().forEach(function(key) {
			output[scope][key] = cache.get(key);
		});
	})

	fs.writeFile(self.path, JSON.stringify(output), 'utf8', function(err) {
		self.suppressEvents = false;
	});
};

Persist.prototype.cache = function(scope) {
	var self = this;

	scope = scope || 'default';
	var cache = self._caches[scope]
	if(!cache) {
		cache = new Cache({
			stdTTL: 0,
			checkperiod: 0
		});

		['set', 'del', 'flush'].forEach(function(event) {
			cache.on(event, function() {
				if(!this.suppressEvents) {
					self.save();
				}
				delete this.suppressEvents;
			});
		});

		cache.quiet = function() {
			cache.suppressEvents = true;
			return cache;
		}
		self._caches[scope] = cache;
	}

	return cache;
};
