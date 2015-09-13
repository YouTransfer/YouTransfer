'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-template-editor';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var TEMPLATE_SELECTOR = 'data-template';

// ------------------------------------------------------------------------------------------ Component Definition

function TemplateEditor(element) {
	var component = this;
	component.$element = $(element);

	var template = element.getAttribute(TEMPLATE_SELECTOR);
	$.get(template).done(function(content) {
		component.$element.html(content);
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new TemplateEditor(element);
});

$(document).on('xhr.loaded', function(event) {
	$(COMPONENT_SELECTOR).each(function(index, element) {
		return new TemplateEditor(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = TemplateEditor;
