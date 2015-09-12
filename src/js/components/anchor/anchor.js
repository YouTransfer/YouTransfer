'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-async';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var CLICK_EVENT_NAMESPACED = 'click.anchor.async';
var TARGET_ATTRIBUTE = 'data-target';

// ------------------------------------------------------------------------------------------ Component Definition

function Anchor(element) {
	var component = this;
	component.$element = $(element);

	component.$element.off(CLICK_EVENT_NAMESPACED);
	component.$element.on(CLICK_EVENT_NAMESPACED, function (e) {
		e.preventDefault();

		var url = this.getAttribute('href');
		var target = this.getAttribute(TARGET_ATTRIBUTE);

		$.get(url).done(function(content) {
			$('#' + target).replaceWith(content);
			$(document).trigger('xhr.loaded', [ element, $('#' + target) ]);
		});
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Anchor(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new Anchor(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Anchor;
