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

}

Errors.prototype.register = function(error, code) {
	var self = this;

	if(_.isArray(error)) {
		_.each(Object.keys(error), function(key) {
			var item = error[key];
			var err = new Error();

			if(_.isError(item)) {
				err = item;
			} else if(_.isObject(item)) {
				err = _.assign(err, item);
			} else {
				throw new Error('Invalid argument exception');
			}

			err.code = item.code || (_.isNaN(parseInt(key)) ? key : 'default');
			self.registered[err.code] = err;
		});
	} else {
		if(_.isError(error)) {
			error = _.assign(error, {
				code: code || (error.code ? error.code : 'default')
			});
		} else if(_.isObject(error)) {
			error = _.assign(new Error(), error, {
				code: code || (error.code ? error.code : 'default')
			});
		} else {
			throw new Error('Invalid argument exception');
		}

		self.registered[error.code] = error;
	}

	return true;
};

Errors.prototype.parse = function(err) {
	if(err) {
		var error = (this.registered[err.code] || 
					 this.registered[err.message]) || 
					 this.registered['default'];
					 
		if(!error) {
			error = err;
		} else {
			error.original = err;
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
};
