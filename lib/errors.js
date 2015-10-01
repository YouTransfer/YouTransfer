'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(req, res, next) {
	req.errors = new Errors();
	next();
};

// ------------------------------------------------------------------------------------------ Module Definition

function Errors() {

	this.registered = [];
	this.errors = [];

};

Errors.prototype.register = function() {
	var self = this;
	var args = arguments;
	if(args.length === 1) {
		var item = args[0];
		if(_.isArray(item)) {
			_.each(Object.keys(item), function(key) {
				var err = item[key];
				var error = new Error();

				if(_.isError(err)) {
					error = err;
				} else if(_.isObject(err)) {
					error = _.assign(error, err);
				} else {
					throw new Error("Invalid argument exception");
				}

				error.code = err.code || (_.isNaN(parseInt(key)) ? key : "default");
				self.registered[error.code] = error;
			});
		} else if(_.isError(item)) {
			var error = item;
			error.code = error.code || "default";
			self.registered[error.code] = error;
		} else if(_.isObject(item)) {
			var error = _.assign(new Error(), item);
			error.code = error.code || "default";
			self.registered[error.code] = error;
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
		self.registered[error.code] = error;
	} else {
		throw new Error("Invalid argument exception");
	}

	return true;
};

Errors.prototype.parse = function(err) {
	if(err) {
		var error = this.registered[err.code] || this.registered['default'];

		if(error) {
			error.original = err;
		} else {
			error = err;
		}

		this.errors.push(error);
	}
	return true;
};

Errors.prototype.get = function() {
	var result = this.errors;
	this.reset();
	return result;
};

Errors.prototype.purge = function() {
	this.registered = [];
};

Errors.prototype.reset = function() {
	this.purge();
	this.errors = [];
};

Errors.prototype.exist = function() {
	return this.errors.length > 0;
};

Errors.prototype.custom = function(code, message) {
	var error = new Error(message);
	error.code = code;
	return error;
}
