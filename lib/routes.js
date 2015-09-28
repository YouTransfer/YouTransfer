'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var fs = require('fs');
var _ = require("lodash");
var uuid = require('uuid');
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

Router.prototype.upload = function() {
	return function(req, res, next) {
		var payload = req.files.payload || req.files['dz-payload'];
		var files = _.isArray(payload) ? payload : new Array(payload);

		var bundle = {
			id: req.params.bundle || uuid.v4(),
			files: []
		}

		var errors = [];
		var completed = _.after(files.length, function() {

			youtransfer.bundle(bundle, function() {
				var response = {
					success: (errors.length <= 0),
					isPostback: true,
					errors: errors,
					bundle: bundle
				};

				if(req.isXmlHtppRequest) {
					res.json(response);
				} else {
					res.render("index.html", response);
				}
				next();
			});
		});

		_.each(files, function(file) {
			youtransfer.upload(file, bundle, function(err, context) {
				if(err) {
					errors.push(err);
				}
				bundle.files.push(context);
				completed();
			});
		});
	};
};

Router.prototype.uploadBundle = function() {
	return function(req, res, next) {
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
};

Router.prototype.send = function() {
	return function(req, res) {
		youtransfer.send(req, res, function() {
			res.redirect("/");
		});
	};
};

Router.prototype.downloadFile = function() {
	return function(req, res, next) {
		var token = req.params.token;
		youtransfer.download(token, res, next);
	};
};

Router.prototype.downloadBundle = function() {
	return function(req, res) {
		var token = req.params.token;
		youtransfer.archive(token, res, function() {
			res.redirect('/');
		});
	};
};

Router.prototype.settingsRedirect = function() {
	return function(req, res) {
		res.redirect('/settings/general');
	};
};

Router.prototype.settingsFinalise = function() {
	return function(req, res) {
		var settings = _.assign(req.params.settings, {
			finalised: true
		});
		youtransfer.settings.push(settings, function() {
			res.redirect('/');
		});
	};
};

Router.prototype.settingsUnlock = function() {
	return function(req, res) {
		youtransfer.settings.get(function(err, settings) {
			if(settings.unlockCode === req.params.unlockCode) {
				youtransfer.settings.push({ 
					finalised: false,
					unlockCode: false
				}, function() {
					res.redirect('/');
				});
			} else {
				res.render('unlock.html', {
					success: false,
					message: 'Incorrect code provided'
				});
			}
		});
	};
}

//TODO: this method only provides JSON output, which will not work with noscript browsers
Router.prototype.settingsGetTemplateByName = function() {
	return function(req, res, next) {
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
};

Router.prototype.settingsSaveTemplate = function() {
	var self = this;
	return function(req, res, next) {
		youtransfer.settings.get(function(err, settings) {
			if(settings.finalised) {
				req.params['name'] = 'template';
				req.params['success'] = false;
				req.params['isPostback'] = true;
				self.settingsGetByName()(req, res, next);
			} else {
				var template = req.params.template;
				if(template) {
					fs.writeFile('./src/templates/' + template, req.params.body, 'utf-8', function(err) {
						req.params['name'] = 'template';
						req.params['success'] = _.isNull(err);
						req.params['isPostback'] = true;
						self.settingsGetByName()(req, res, next);					
					});
				} else {
					req.params['name'] = 'template';
					req.params['success'] = false;
					req.params['isPostback'] = true;
					self.settingsGetByName()(req, res, next);					
				}
			}
		});
	};
};

Router.prototype.settingsGetByName = function() {
	return function(req, res, next) {
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
};

Router.prototype.settingsSaveByName = function() {
	var self = this;
	return function(req, res, next) {
		var settings = req.params.settings;
		youtransfer.settings.push(settings, function(err) {
			req.params['success'] = _.isNull(err);
			req.params['isPostback'] = true;
			self.settingsGetByName()(req, res, next);
		});
	};
};

Router.prototype.staticFiles = function() {
	var self = this;
	return function(req, res) {	
		self.fileServer.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
	}
};

Router.prototype.default = function() {
	return function(req, res) {
		var page = req.params[0] || 'index';
		res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		res.render(page + ".html");
	};
}