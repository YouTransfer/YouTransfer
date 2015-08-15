'use strict';

// ------------------------------------------------------------------------------------------ Component Dependencies

var $ = require('jquery');
var Dropzone = require('dropzone');
Dropzone.autoDiscover = false;

// ------------------------------------------------------------------------------------------ Component Variables

var COMPONENT_ATTR = 'data-fileupload';
var COMPONENT_SELECTOR = '[' + COMPONENT_ATTR + ']';
var DROPZONE_CLASS = 'dropzone';
var DROPZONE_PREVIEW_TEMPLATE_SELECTOR = '.dz-preview-template';
var DROPZONE_ACTIONS_CONTAINER_SELECTOR = '.dz-action-container';
var DROPZONE_ACTIONS_ADD_SELECTOR = '.dz-action-add';
var DROPZONE_ACTIONS_START_SELECTOR = '.dz-action-start';
var DROPZONE_ACTIONS_CANCEL_SELECTOR = '.dz-action-cancel';
var DROPZONE_TOTALUPLOADPROGRESSBAR_SELECTOR = '.dz-totaluploadprogress';

// ------------------------------------------------------------------------------------------ Component Definition

function Fileupload(element) {
	var component = this;
	component.$element = $(element);

	component.previewTemplate = component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).html();
	component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).empty();
	component.previewContainer = component.$element.find(DROPZONE_PREVIEW_TEMPLATE_SELECTOR).get(0);

	component.$element.addClass(DROPZONE_CLASS);
	component.dropzone = new Dropzone(element, {
		url: '/upload',
		paramName: 'payload',
		dictDefaultMessage: 'Drop files here or click to upload',

		autoQueue: false,
		thumbnailWidth: 80,
		thumbnailHeight: 80,
		parallelUploads: 20,
		previewTemplate: component.previewTemplate,
		previewsContainer: component.previewContainer,
		clickable: DROPZONE_ACTIONS_ADD_SELECTOR
	});

	component.dropzone.on("reset", function(progress) {
		component.$element.find(DROPZONE_ACTIONS_CONTAINER_SELECTOR).addClass('hidden');
	});

	component.dropzone.on("addedfile", function(file) {
		component.$element.find(DROPZONE_ACTIONS_CONTAINER_SELECTOR).removeClass('hidden');
		$(file.previewElement).find(DROPZONE_ACTIONS_START_SELECTOR).click(function() { 
			component.dropzone.enqueueFile(file); 
		});
	});

	component.dropzone.on("totaluploadprogress", function(progress) {
		component.$element.find(DROPZONE_TOTALUPLOADPROGRESSBAR_SELECTOR).find(".progress-bar").width(progress + "%");
	});

	component.dropzone.on("sending", function(file) {
		component.$element.find(DROPZONE_TOTALUPLOADPROGRESSBAR_SELECTOR).removeClass('hidden');
		$(file.previewElement).find(DROPZONE_ACTIONS_START_SELECTOR).attr("disabled", "disabled");
	});

	component.dropzone.on("queuecomplete", function(progress) {
		component.$element.find(DROPZONE_TOTALUPLOADPROGRESSBAR_SELECTOR).addClass('hidden');
	});

	component.$element.find(DROPZONE_ACTIONS_START_SELECTOR).click(function() {
		component.dropzone.enqueueFiles(component.dropzone.getFilesWithStatus(Dropzone.ADDED));
	});

	component.$element.find(DROPZONE_ACTIONS_CANCEL_SELECTOR).click(function() {
		component.dropzone.removeAllFiles(true);
	});

}

// ------------------------------------------------------------------------------------------ Component Initialization

$(COMPONENT_SELECTOR).each(function(index, element) {
	return new Fileupload(element);
});

// ------------------------------------------------------------------------------------------ Component Exposure

module.exports = Fileupload;
