/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = window.jQuery = require('jquery');
var Bootstrap = require('bootstrap');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-dropdown';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var DROPDOWN_SELECTOR = 'dropdown';

// ------------------------------------------------------------------------------------------ Component Definition

function Dropdown(element) {
	var component = this;
	component.$element = $(element);
	component.$element.removeClass(DROPDOWN_SELECTOR);
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Dropdown(element);
});

$(document).on('xhr.loaded', function() {
	$(COMPONENT_SELECTOR).each(function(index, element) {
		return new Dropdown(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Dropdown;
