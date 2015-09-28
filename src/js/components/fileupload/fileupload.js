'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');
var uuid = require('uuid');
var Dropzone = require('dropzone');
Dropzone.autoDiscover = false;

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-fileupload';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var DROPZONE_CLASS = 'dropzone';
var DROPZONE_PARAMETER = 'dz-payload';

var DROPZONE_PREVIEW_TEMPLATE_SELECTOR = '.dz-preview-template';
var DROPZONE_PREVIEW_DESCRIPTION_SELECTOR = '.dz-preview-description';
var DROPZONE_PREVIEW_DATALINK_SELECTOR = '[data-dz-link]';

var DROPZONE_UPLOAD_COMPLETE_CLASS = 'dz-upload-complete';
var DROPZONE_UPLOAD_COMPLETE_SELECTOR = '.' + DROPZONE_UPLOAD_COMPLETE_CLASS;
var DROPZONE_COMPLETED_CONTAINER_SELECTOR = '.dz-completed-container';

var DROPZONE_ACTIONS_ADD_SELECTOR = '.dz-action-add';

// ------------------------------------------------------------------------------------------ Component Definition

function Fileupload(element) {
	var component = this;
	component.$element = $(element);
	component.$element.addClass(DROPZONE_CLASS);

	component.bundle = {
		id: uuid.v4(),
		files: []
	};

	component.previewTemplate = component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).html();
	component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).empty();

	component.$previewContainer = component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR);
	component.$previewContainer.removeClass('hidden');
	component.previewContainer = component.$previewContainer.get(0);

	component.completeTemplate = component.$element.find(DROPZONE_UPLOAD_COMPLETE_SELECTOR);
	component.completeTemplate = component.completeTemplate.detach().html();
	component.$completedContainer = $(DROPZONE_COMPLETED_CONTAINER_SELECTOR);

	$.getJSON('/settings/dropzone').done(function(settings) {
		$.extend(settings, {
			url: '/upload',
			paramName: DROPZONE_PARAMETER,
			dictDefaultMessage: '<span class="glyphicon glyphicon-download-alt" style="font-size: 3em;"></span><br /><br /> Drop files here or click to select',
			dictFallbackMessage: '',

			previewTemplate: component.previewTemplate,
			previewsContainer: component.previewContainer,
			clickable: DROPZONE_ACTIONS_ADD_SELECTOR
		});

		component.dropzone = new Dropzone(element, settings);

		if(!settings.forceFallback) {
			component.dropzone.on("addedfile", function(file) {
				component.$element.addClass("dz-files-added");
			});

			component.dropzone.on("sending", function(file, xhr, formData) {
				formData.append("bundle", component.bundle.id);
			});

			component.dropzone.on("complete", function(result) {
				var response = JSON.parse(result.xhr.response);
				var file = response.bundle.files[0];
				$(result.previewElement).find(DROPZONE_PREVIEW_DESCRIPTION_SELECTOR).removeClass('col-md-7');
				$(result.previewElement).find(DROPZONE_PREVIEW_DATALINK_SELECTOR).append('<a href="/download/' + file.id + '"><span class="glyphicon glyphicon-download-alt"></span> ' + file.id + '</a>');
				component.bundle.files.push(file);
			});

			component.dropzone.on('queuecomplete', function() {
				$.post('/upload/bundle', {
					bundle: JSON.stringify(component.bundle)
				}).done(function() {

					component.$completedContainer
							 .html(component.completeTemplate)
							 .addClass(DROPZONE_UPLOAD_COMPLETE_CLASS);

					$(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).prepend('<div class="dz-preview-bundle"><span class="glyphicon glyphicon-download-alt"></span> <a href="/bundle/' + component.bundle.id + '/">Download all files as a zip archive (<span class="glyphicon glyphicon-compressed"></span>)</a></div>');
					component.$completedContainer
							 .find('form')
							 .append('<input type="hidden" name="bundle" value="' + component.bundle.id + '" />');

				});
			});

			component.dropzone.on("reset", function(progress) {
				component.$element.removeClass("dz-files-added");
			});
		}
	});
}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Fileupload(element);
});

$(document).on('xhr.loaded', function(event, element, target) {
	$(target).find(COMPONENT_SELECTOR).each(function(index, item) {
		return new Fileupload(item);
	});
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Fileupload;
