'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = window.jQuery = require('jquery');
var Bootstrap = require('bootstrap');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'role="alert"';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var CLOSE_BUTTON_SELECTOR = 'button.close';
var TIMEOUT = 5000;

// ------------------------------------------------------------------------------------------ Component Definition

function Alerts(element) {
	var component = this;
	component.$element = $(element);
	component.$element.find(CLOSE_BUTTON_SELECTOR).removeClass('hidden');

	setTimeout(function() {
		component.$element.fadeOut();
	}, TIMEOUT);
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Alerts(element);
});

$(document).on('xhr.loaded', function(event) {
	$(COMPONENT_SELECTOR).each(function(index, element) {
		return new Alerts(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Alerts;
