'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = window.jQuery = require('jquery');
var Bootstrap = require('bootstrap');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'role="alert"';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';

// ------------------------------------------------------------------------------------------ Component Definition

function Alerts(element) {
	var component = this;
	component.$element = $(element);
	component.$element.find('button.close').removeClass('hidden');
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Alerts(element);
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Alerts;
