'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require('fs');
var _ = require("lodash");
var nconf = require('nconf');
var nstatic = require('node-static');
var fileServer = new nstatic.Server('./dist');
var youtransfer = require("./youtransfer");

// ------------------------------------------------------------------------------------------ Module definition

function Router() {}

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
	youtransfer.settings.get(function(err, settings) {
		var bundle = JSON.parse(req.params.bundle);
		if(bundle) {
			youtransfer.bundle(bundle, function(err) {
				var response = {
					success: _.isNull(err),
					isPostback: true, 
					error: (err ? err.message : '')
				}

				if(req.isXmlHtppRequest) {
					res.json(response);
				} else {
					res.render("index.html", response);
				}
			});
		}
	});
};

Router.prototype.send = function(req, res, next) {
	youtransfer.send(req, res, function(err) {
		res.redirect("/");
	});
};

Router.prototype.downloadFile = function(req, res, next) {
	var token = req.params.token;
	youtransfer.download(token, res, function(err) {
		res.redirect("/");
	});
};

Router.prototype.downloadBundle = function(req, res, next) {
	var token = req.params.token;
	youtransfer.archive(token, res, function(err, archive) {
		res.redirect('/');
	});
};

Router.prototype.settingsRedirect = function(req, res, next) {
	res.redirect('/settings/general');
};

Router.prototype.settingsFinalise = function(req, res, next) {
	youtransfer.settings.push({
		finalised: true
	}, function(err) {
		res.redirect('/');
	});
};

Router.prototype.settingsGetTemplateByName = function(req, res, next) {
	youtransfer.settings.get(function(err, settings) {
		if(settings.finalised) {
			res.json({success: false, err: 'The settings have been finalised and cannot be modified'});
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
						res.end;
					}
				});
			} else {
				res.json({success: false, err: 'template not found'});
			}
		}
	});
};

Router.prototype.settingsSaveTemplate = function(req, res, next) {
	youtransfer.settings.get(function(err, settings) {
		if(settings.finalised) {
			res.json({success: false, err: 'The settings have been finalised and cannot be modified'});
		} else {
			var template = req.params.template;
			if(template) {
				fs.writeFile('./src/templates/' + template, req.params.body, 'utf-8', function(err) {
					res.render('settings.template.html', {
						success: _.isNull(err),
						isPostback: true,
						template: template
					});
				});
			} else {
				res.render('settings.template.html', {
					success: false,
					isPostback: true,
					template: template
				});
			}
		}
	});
};

Router.prototype.settingsGetByName = function(req, res, next) {
	var page = req.params.name || 'general';
	youtransfer.settings.get(function(err, settings) {
		if(page == 'dropzone') {
			var output = settings.dropzone || {};
			res.json(output);
		} else {
			if(settings.finalised) {
				res.render('404.html');
			} else {
				res.render('settings.' + page + '.html', {
					activeTab: page
				});
			}
		}
	});
};

Router.prototype.settingsSaveByname = function(req, res, next) {
	var settings = req.params["settings"];
	youtransfer.settings.push(settings, function(err) {
		var page = req.params.name || 'general';
		res.render('settings.' + page + '.html', {
			isPostback: true,
			success: _.isNull(err),
			activeTab: page
		});
	});
};

Router.prototype.staticFiles = function(req, res, next) {
	fileServer.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
};

Router.prototype.default = function(req, res, next) {
	var page = req.params[0] || 'index';
	res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
	res.render(page + ".html");
};

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = new Router();

