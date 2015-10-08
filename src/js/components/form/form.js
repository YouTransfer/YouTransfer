/*jslint browser: true*/
'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

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
		success: function(response, status, xhr, $form) {
			var content = $(response.output);

			var target = $('#' + element.getAttribute(FORM_TARGET_ATTRIBUTE)) || component.$element; 
			target.replaceWith(content);

			$(document).trigger('xhr.loaded', [ element, content ]);
			$(document).trigger('component.form.success');
		}
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Form(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new Form(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Form;
