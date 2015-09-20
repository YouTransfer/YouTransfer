'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require('fs');
var _ = require("lodash");
var nconf = require('nconf');
var nstatic = require('node-static');
var youtransfer = require("./youtransfer");

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
		throw "Invalid options provided";
	}
}

Router.prototype.upload = function(req, res, next) {
	youtransfer.settings.get(function(err, settings) {
		var file = req.files.payload || req.files['dz-payload'];
		var bundle = req.params.bundle;
		youtransfer.upload(file, bundle, function(err, context) {
			var response = _.assign({
				success: _.isNull(err),
				isPostback: true, 
				link: settings.baseUrl + '/download/' + context.id + '/',
				error: (err ? err.message : '')
			}, context);

			if(req.isXmlHtppRequest) {
				res.json(response);
			} else {
				res.render("index.html", response);
			}
			next();
		});
	});
};

Router.prototype.uploadBundle = function(req, res, next) {
	var bundle = JSON.parse(req.params.bundle);
	youtransfer.bundle(bundle, function(err) {
		var response = {
			success: _.isNull(err),
			isPostback: true, 
			error: (err ? err.message : '')
		};

		if(req.isXmlHtppRequest) {
			res.json(response);
		} else {
			res.render("index.html", response);
		}

		next();
	});
};

Router.prototype.send = function(req, res) {
	youtransfer.send(req, res, function() {
		res.redirect("/");
	});
};

Router.prototype.downloadFile = function(req, res) {
	var token = req.params.token;
	youtransfer.download(token, res, function() {
		res.redirect("/");
	});
};

Router.prototype.downloadBundle = function(req, res) {
	var token = req.params.token;
	youtransfer.archive(token, res, function() {
		res.redirect('/');
	});
};

Router.prototype.settingsRedirect = function(req, res) {
	res.redirect('/settings/general');
};

Router.prototype.settingsFinalise = function(req, res) {
	youtransfer.settings.push({
		finalised: true
	}, function() {
		res.redirect('/');
	});
};

//TODO: this method only provides JSON output, which will not work with noscript browsers
Router.prototype.settingsGetTemplateByName = function(req, res, next) {
	youtransfer.settings.get(function(err, settings) {
		if(settings.finalised) {
			res.json({success: false, err: 'The settings have been finalised and cannot be modified'});
			next();
		} else {
			var template = req.params.name;
			if(template) {
				fs.readFile('./src/templates/' + template, 'utf-8', function(err, data) {
					if(err) {
						res.json({ success: false, err: err.message });
					} else {
						res.setHeader('Content-Type', 'text/html');
						res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
						res.send(data);
						res.end();
					}
					next();
				});
			} else {
				res.json({success: false, err: 'template not found'});
				next();
			}
		}
	});
};

//TODO: this method only provides JSON output, which will not work with noscript browsers
Router.prototype.settingsSaveTemplate = function(req, res, next) {
	youtransfer.settings.get(function(err, settings) {
		if(settings.finalised) {
			res.json({success: false, err: 'The settings have been finalised and cannot be modified'});
			next();
		} else {
			var template = req.params.template;
			if(template) {
				fs.writeFile('./src/templates/' + template, req.params.body, 'utf-8', function(err) {
					res.json({
						success: _.isNull(err),
						isPostback: true,
						template: template
					});
				});
				next();
			} else {
				res.json({
					success: false,
					isPostback: true,
					template: template,
					err: 'Invalid template provided'
				});
				next();
			}
		}
	});
};

Router.prototype.settingsGetByName = function(req, res, next) {
	var page = req.params.name || 'general';
	youtransfer.settings.get(function(err, settings) {
		if(page === 'dropzone' && req.isXmlHtppRequest) {
			var output = settings.dropzone || {};
			res.json(output);
			next();
		} else {
			if(settings.finalised) {
				res.render('404.html');
				next();
			} else {
				res.render('settings.' + page + '.html', {
					activeTab: page
				});
				next();
			}
		}
	});
};

Router.prototype.settingsSaveByName = function(req, res, next) {
	var self = this;
	var settings = req.params.settings;
	youtransfer.settings.push(settings, function() {
		self.settingsGetByName(req, res, next);
	});
};

Router.prototype.staticFiles = function(req, res) {
	this.fileServer.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
};

Router.prototype.default = function(req, res) {
	var page = req.params[0] || 'index';
	res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
	res.render(page + ".html");
};
