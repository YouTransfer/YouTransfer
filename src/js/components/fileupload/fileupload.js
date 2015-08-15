'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');
var Dropzone = require('dropzone');
Dropzone.autoDiscover = false;

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-fileupload';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var DROPZONE_CLASS = 'dropzone';

// ------------------------------------------------------------------------------------------ Component Definition

function Fileupload(element) {
	var component = this;
	component.$element = $(element);

	component.$element.addClass(DROPZONE_CLASS);
	component.$element.append('<input type="hidden" name="xhr-fileupload" value="true" />');
	
	component.dropzone = new Dropzone(element, {
		paramName: 'payload',
		dictDefaultMessage: 'Drop files here or click to upload'
	});

	component.dropzone.on("complete", function() {
		console.log(arguments);
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Fileupload(element);
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Fileupload;
