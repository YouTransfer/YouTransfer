'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

require('date-utils');
var _ = require('lodash');
var uuid = require('uuid');
var nconf = require('nconf');
var nstatic = require('node-static');
var validator = require('validator');
var youtransfer = require('./youtransfer');

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = function(options) {
	return new Router(options);
};

// ------------------------------------------------------------------------------------------ Module definition

function Router(options) {
	options = options || {};
	this.options = options;

	if(_.isString(this.options)) {
		this.fileServer = new nstatic.Server(this.options);
	} else if(_.isObject(this.options)) {
		this.fileServer = options.fileServer || new nstatic.Server('./dist');
	} else {
		throw 'Invalid options provided';
	}
}

Router.prototype.upload = function() {
	return function(req, res, next) {

		req.errors.register(new Error('An error occurred while uploading your file(s).'));
		var payload = req.files.payload || req.files['dz-payload'];
		var files = _.isArray(payload) ? payload : new Array(payload);

		var bundle = {
			id: req.params.bundle || uuid.v4(),
			files: []
		};

		var completed = _.after(files.length, function() {
			if(!req.errors.exist()) {
				youtransfer.bundle(bundle, function(err) {
					var response = {
						bundle: bundle
					};
					req.errors.parse(err);
					res.process('index.html', response, next);
				});
			} else {
				res.process('index.html', null, next);
			}
		});

		_.each(files, function(file) {
			youtransfer.upload(file, bundle, function(err, context) {
				if(!req.errors.exist()) {
					req.errors.parse(err);
					bundle.files.push(context);
				}
				completed();
			});
		});
	};
};

Router.prototype.uploadBundle = function() {
	return function(req, res, next) {
		req.errors.register(new Error('An error occurred while uploading your file(s)'));

		try {
			var bundle = JSON.parse(req.params.bundle);
			youtransfer.bundle(bundle, function(err) {
				req.errors.parse(err);
				res.process('index.html', null, next);
			});
		} catch (err) {
			req.errors.parse(err);
			res.process('index.html', null, next);
		}
	};
};

Router.prototype.send = function() {
	return function(req, res, next) {
		req.errors.register(new Error('An error occurred while sending your message'));
		youtransfer.send(req, res, function(err) {
			req.errors.parse(err);
			res.process('index.html', null, next);
		});
	};
};

Router.prototype.download = function() {
	return function(req, res, next) {

		req.errors.register([
			{
				code: 'ENOENT',
				message: 'Oh no... there is no file or archive to match this token! Are you sure you\'ve entered the right one?',
				html: 'Oh no... there is no file or archive to match this token!<br />Are you sure you\'ve entered the right one?'
			},
			{
				message: 'Oh my... something went terribly wrong!',
			}
		]);

		var token = req.params.token;
		var callback = function(err) {
			req.errors.parse(err);
			res.process('download.html', null, next);
		};

		if(validator.isUUID(token)) {
			youtransfer.archive(token, res, callback);
		} else {
			youtransfer.download(token, res, callback);
		}

	};
};

Router.prototype.settingsRedirect = function() {
	return function(req, res) {
		res.redirect('/settings/general');
	};
};

Router.prototype.settingsFinalise = function() {
	return function(req, res, next) {
		req.errors.register(new Error('An unknown error occurred while finalising the settings. Please try again.'));

		youtransfer.settings.finalise(req.params.settings.state.unlockCode, function(err) {
			req.errors.parse(err);
			if(req.errors.exist()) {
				res.process('settings.finalise.html', null, next);
			} else {
				res.redirect('/');
				next();
			}
		});
	};
};

Router.prototype.settingsUnlock = function() {
	return function(req, res, next) {
		req.errors.register([
			new Error('An unknown error occurred while unlocking the settings'),
			{
				code: 'INVALID_CODE',
				message: 'The unlock code is invalid. Please try again',
			}
		]);

		youtransfer.settings.unlock(req.params.unlockCode, function(err) {
			req.errors.parse(err);
			if(req.errors.exist()) {
				res.process('unlock.html', null, next);
			} else {
				res.redirect('/');
				next();
			}
		});
	};
};

//TODO: this method only provides JSON output, which will not work with noscript browsers
Router.prototype.settingsGetTemplateByName = function() {
	return function(req, res, next) {

		req.errors.register([
			new Error('An error occurred while trying to retrieve the template'),
			{
				code: 'ENOENT',
				message: 'An invalid template has been selected. Please try again.',
			},
			{
				code: 'SETTINGS_FINALISED',
				message: 'The settings are currently locked. Please unlock them if you wish to make changes.',
				html: 'The settings are currently locked. Please <a href="/unlock">unlock</a> them if you wish to make changes.'
			}
		]);

		var template = req.params.template;
		youtransfer.templates.get(template, function(err, data) {
			if(err) {
				req.errors.parse(err);
				res.process('settings.template.html', null, next);
			} else {
				res.on('end', next);
				res.setHeader('Content-Type', 'text/html');
				res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
				res.send(data);
				res.end();
			}
		});
	};
};

Router.prototype.settingsSaveTemplate = function() {
	var self = this;
	return function(req, res, next) {

		req.errors.register([
			new Error('An error occurred while trying to save the template'),
			{
				code: 'ENOENT',
				message: 'An invalid template has been selected. Please try again.',
			},
			{
				code: 'SETTINGS_FINALISED',
				message: 'The settings are currently locked. Please unlock them if you wish to make changes.',
				html: 'The settings are currently locked. Please <a href="/unlock">unlock</a> them if you wish to make changes.'
			}
		]);

		var template = req.params.template;
		var content = req.params.body;
		youtransfer.templates.push(template, content, function(err) {
			req.errors.parse(err);
			if(req.errors.exist()) {
				res.process('settings.template.html', null, next);
			} else {
				self.settingsGetByName()(req, res, next);
			}
		});
	};
};

Router.prototype.settingsGetByName = function() {
	return function(req, res, next) {

		req.errors.register(new Error('An unknown error occurred while retrieving the settings'));

		var page = req.params.name || 'general';
		youtransfer.settings.get(function(err, settings) {
			req.errors.parse(err);

			var context = {
				activeTab: page
			};

			if(page === 'dropzone') {
				context.dropzone = settings.dropzone || {};
			}

			if(settings.state.finalised) {
				res.process('404.html', context, next);
			} else {
				res.process('settings.' + page + '.html', context, next);
			}
		});
	};
};

Router.prototype.settingsSaveByName = function() {
	var self = this;
	return function(req, res, next) {

		if(req.params.name === 'template') {
			self.settingsSaveTemplate()(req, res, next);
		} else {

			req.errors.register([
				new Error('An unknown error occurred while saving the settings'),
				{
					code: 'SETTINGS_FINALISED',
					message: 'The settings are currently locked. Please unlock them prior to making changes.',
					html: 'The settings are currently locked. Please <a href="/unlock">unlock</a> them prior to making changes.'
				}
			]);

			var value = req.params.settings;
			youtransfer.settings.push(value, function(err) {
				req.errors.parse(err);
				self.settingsGetByName()(req, res, next);
			});
		}
	};
};

Router.prototype.signout = function() {
	return function(req, res) {
		req.logout();
		res.redirect('/');
	};
};

Router.prototype.staticFiles = function() {
	var self = this;
	return function(req, res) {
		self.fileServer.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
	};
};

Router.prototype.default = function() {
	return function(req, res, next) {
		var page = req.params[0] || 'index';
		res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		res.process(page + '.html', null, next);
	};
};
