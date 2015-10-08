/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = window.jQuery = require('jquery');
var Bootstrap = require('bootstrap');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'role="tablist"';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var XHR_LOADED_EVENT_NAMESPACED = 'xhr.loaded.tabs';
var TAB_ROLE = 'tab';

// ------------------------------------------------------------------------------------------ Component Definition

function Tabs(element) {
	var component = this;
	component.$element = $(element);

	$(document).off(XHR_LOADED_EVENT_NAMESPACED);
	$(document).on(XHR_LOADED_EVENT_NAMESPACED, function(event, elm) {
		if(elm.getAttribute('role') === TAB_ROLE) {
			var url = elm.getAttribute('href');
			if(url) {
				component.$element.find('li').removeClass('active');
				component.$element.find('li a[href="' + url + '"]').closest('li').addClass('active');
			}
		}
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Tabs(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new Tabs(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Tabs;
