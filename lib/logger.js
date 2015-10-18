'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var bunyan = require('bunyan');
var formatter = require('bunyan-format');
var format = formatter({ outputMode: 'short' })

// ------------------------------------------------------------------------------------------ Module definition

module.exports = function(name) {
	name = name || "youtransfer";
	return bunyan.createLogger({name: name, stream: format})
};
