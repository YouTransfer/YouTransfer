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

	var current = window.location.protocol + '//' + window.location.host;
	var baseUrl = element.getAttribute('value');
	if(baseUrl.indexOf(current) !== 0) {
		$('body').prepend('<div class="baseurl alert alert-warning"><strong>Warning</strong>: the base URL is set to ' + baseUrl + ' but you are accessing this page from ' + current + '. It is recommended to update the BaseUrl setting.</div>');
	}
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new BaseUrl(element);
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = BaseUrl;
