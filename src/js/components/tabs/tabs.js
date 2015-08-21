'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = window.jQuery = require('jquery');
var Bootstrap = require('bootstrap');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'role="tablist"';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';

// ------------------------------------------------------------------------------------------ Component Definition

function Tabs(element) {
	var component = this;
	component.$element = $(element);

	component.$element.find('li a').click(function (e) {
		e.preventDefault()
		$(this).tab('show')
	});

	component.$element.find("li > a").on("shown.bs.tab", function (e) {
		var hash = $(e.target).attr("href").substr(1);
		window.location.hash = hash;
    });

	var hash = window.location.hash;
	component.$element.find('a[href="' + hash + '"]').tab('show');
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Tabs(element);
});

$(document).on('xhrform-success', function(event, element) {
	$(element).find(COMPONENT_SELECTOR).each(function(index, element) {
		return new Tabs(element);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Tabs;
