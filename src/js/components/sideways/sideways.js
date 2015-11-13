/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-sideways';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var ITEM_CLASS = 'sideways-item';
var ITEM_CLASS_SELECTOR = '.' + ITEM_CLASS;
var ITEM_OVERLAY_CLASS = 'sideways-overlay'
var ITEM_OVERLAY_CLASS_SELECTOR = '.' + ITEM_OVERLAY_CLASS;
var ITEM_ACTIVE_CLASS = 'active';
var TARGET_ATTRIBUTE = 'data-target';

// ------------------------------------------------------------------------------------------ Component Definition

function Sideways(element) {
	var component = this;
	component.$element = $(element);

	var id = element.getAttribute('href') || element.getAttribute(TARGET_ATTRIBUTE);
	$(id).addClass(ITEM_CLASS).append('<div class="' + ITEM_OVERLAY_CLASS + '"></div>');

	component.$element.on('click', function (e) {
		e.preventDefault();
		$(ITEM_CLASS_SELECTOR).removeClass(ITEM_ACTIVE_CLASS).find(ITEM_OVERLAY_CLASS_SELECTOR).removeAttr('style');
		$(id).addClass(ITEM_ACTIVE_CLASS).find(ITEM_OVERLAY_CLASS_SELECTOR).animate({ width: 'toggle' });
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Sideways(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new Sideways(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Sideways;
