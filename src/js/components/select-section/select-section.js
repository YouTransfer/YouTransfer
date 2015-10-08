/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-select';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var SELECT_CONTENT_SELECTOR = '[data-select-content]';
var SELECT_SECTION_SELECTOR = '> *[role="select-section"]';
var SELECT_TARGET_SELECTOR = 'data-select-target';

// ------------------------------------------------------------------------------------------ Component Definition

function SelectSection(element) {
	var component = this;
	component.$element = $(element);
	component.$element.closest(SELECT_CONTENT_SELECTOR)
					  .addClass('select-section-container');

	element.onchange = function(event) {
		component.$element.closest(SELECT_CONTENT_SELECTOR)
						  .find(SELECT_SECTION_SELECTOR)
						  .removeClass('active');

		var option = element.options[element.selectedIndex];
		var id = option.getAttribute(SELECT_TARGET_SELECTOR) || option.getAttribute('value');
		$('#' + id).addClass('active');
	};
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new SelectSection(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new SelectSection(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = SelectSection;
