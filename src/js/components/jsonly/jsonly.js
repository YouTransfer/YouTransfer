/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-js-only';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';

// ------------------------------------------------------------------------------------------ Component Definition

function JSOnly(element) {
	var component = this;
	component.$element = $(element);
	element.removeAttribute(COMPONENT_ATTR);
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new JSOnly(element);
});

$(document).on('xhr.loaded', function() {
	$(COMPONENT_SELECTOR).each(function(index, element) {
		return new JSOnly(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = JSOnly;
