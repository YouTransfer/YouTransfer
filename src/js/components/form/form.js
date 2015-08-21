'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = require('jquery');
var $form = require('../../../../node_modules/jquery-form/jquery.form.js');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-xhrform';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var FORM_TARGET_ATTRIBUTE = 'data-xhrform-target';
var FORM_REPLACETARGET_ATTRIBUTE = 'data-xhrform-replace';

// ------------------------------------------------------------------------------------------ Component Definition

function Form(element) {
	var component = this;
	component.$element = $(element);

	component.$element.ajaxForm({
		target: $(element.getAttribute(FORM_TARGET_ATTRIBUTE)) || component.$element,
		replaceTarget: element.getAttribute(FORM_REPLACETARGET_ATTRIBUTE) || false,
		success: function() {
			$(document).trigger('xhrform-success', $(element.getAttribute(FORM_TARGET_ATTRIBUTE)) || component.$element)
		}
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Form(element);
});

$(document).on('xhrform-success', function(event, element) {
	$(element).find(COMPONENT_SELECTOR).each(function(index, element) {
		return new Form(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Form;
