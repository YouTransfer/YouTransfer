'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

// Unfortunately, Bootstrap requires global jQuery object
var $ = require('jquery');

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'name="baseurl"';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';

// ------------------------------------------------------------------------------------------ Component Definition

function BaseUrl(element) {
	var component = this;
	component.$element = $(element);

	var current = document.createElement('a');
	current.href = window.location.href;

	var baseUrl = document.createElement('a');
	baseUrl.href = element.getAttribute('value');

	if(current.host != baseUrl.host) {
		$('body').prepend('<div class="baseurl alert alert-warning"><strong>Warning</strong>: the base URL is set to ' + baseUrl.host + ' but you are accessing this page from ' + current.host + '. It is recommended to update the BaseUrl setting.</div>');
	}
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new BaseUrl(element);
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = BaseUrl;
