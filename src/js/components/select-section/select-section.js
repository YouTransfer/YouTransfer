'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-select';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';

// ------------------------------------------------------------------------------------------ Component Definition

function SelectSection(element) {
	var component = this;
	component.$element = $(element);

	element.onchange = function(event) {
		component.$element.closest('[data-select-content]')
						  .find('> *[role="select-section"]')
						  .removeClass('active');

		var option = element.options[element.selectedIndex];
		var id = option.getAttribute('data-select-target') || option.getAttribute('value');
		$('#' + id).addClass('active');
	};
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new SelectSection(element);
});

$(document).on('xhrform-success', function(event, element) {
	$(element).find(COMPONENT_SELECTOR).each(function(index, element) {
		return new SelectSection(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = SelectSection;
