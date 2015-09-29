'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = (function() {

	var self = {},
		registered = [],
		errors = [];

	self.register = function() {

		var args = arguments;
		if(args.length === 1) {
			var item = args[0];
			if(_.isArray(item)) {
				_.each(Object.keys(item), function(code) {
					var err = item[code];
					var error = new Error();
					code = parseInt(code) || code;

					if(_.isError(err)) {
						error = err;
					} else if(_.isObject(err)) {
						error = _.assign(error, err);
					} else {
						throw new Error("Invalid argument exception");
					}

					error.code = err.code || (_.isString(code) ? code : "default");
					registered[error.code] = error;
				});
			} else if(_.isError(item)) {
				var error = item;
				error.code = error.code || "default";
				registered[error.code] = error;
			} else if(_.isObject(item)) {
				var error = _.assign(new Error(), item);
				error.code = error.code || "default";
				registered[error.code] = error;
			} else {
				throw new Error("Invalid argument exception");
			}
		} else if(args.length === 2) {
			var code = args[0],
				err = args[1],
				error = new Error();

			if(_.isError(err)) {
				error = err;
			} else if(_.isObject(err)) {
				error = _.assign(error, err);
			} else {
				throw new Error("Invalid argument exception");
			}

			error.code = code || (err.code ? err.code : "default");
			registered[error.code] = error;
		} else {
			throw new Error("Invalid argument exception");
		}

		return true;
	};

	self.parse = function(err) {
		if(err) {
			var error = registered[err.code] || registered['default'];

			if(error) {
				error.original = err;
			} else {
				error = err;
			}

			errors.push(error);
		}
		self.purge();
		return true;
	}

	self.get = function() {
		var result = errors;
		self.reset();
		return result;
	};

	self.purge = function() {
		registered = [];
	};

	self.reset = function() {
		self.purge();
		errors = [];
	};

	self.exist = function() {
		return errors.length > 0;
	};

	return self;
})();
