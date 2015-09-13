'use strict';

var fs = require('fs');
var _ = require("lodash");
var youtransfer = require("./youtransfer.js");

module.exports = function(app, nconf) {

	app.post('/upload', function(req, res, next) {
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
			});
		});
	});

	app.post('/upload/bundle', function(req, res, next) {
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
	});

	app.post(/^\/send/, function(req, res, next) {
		youtransfer.send(req, res, function(err) {
			res.redirect("/");
		});
	});

	app.get('/download/:token', function(req, res, next) {
		var token = req.params.token;
		youtransfer.download(token, res, function(err) {
			res.redirect("/");
		});
	});

	app.post(/^\/download/, function(req, res, next) {
		var token = req.params.token;
		youtransfer.download(token, res, function(err) {
			res.redirect("/");
		});
	});

	app.get('/bundle/:token', function(req, res, next) {
		var token = req.params.token;
		youtransfer.archive(token, res, function(err, archive) {
			res.redirect('/');
		});
	});

	app.get('/settings', function(req, res, next) {
		res.redirect('/settings/general');
	});

	app.post('/settings/finalise', function(req, res, next) {
		youtransfer.settings.push({
			finalised: true
		}, function(err) {
			res.redirect('/');
		});
	});

	app.get('/settings/template/:name', function(req, res, next) {
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
	});

	app.post('/settings/template/', function(req, res, next) {
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
	});	

	app.get('/settings/:name', function(req, res, next) {
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
	});

	app.post('/settings/:name', function(req, res, next) {
		var settings = req.params["settings"];
		youtransfer.settings.push(settings, function(err) {
			var page = req.params.name || 'general';
			res.render('settings.' + page + '.html', {
				isPostback: true,
				success: _.isNull(err),
				activeTab: page
			});
		});
	});

	// ------------------------------------------------------------------------------------------ Static Server routes

	// Service static resources
	app.get(/^(\/v\d*)?\/(js|css|assets|fonts|img|sounds)\/(.*)/, function(req, res, next) {
		app.static.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
	});

	// ------------------------------------------------------------------------------------------ Redirect all other routes to client-side

	// Try to render page based on path
	app.get(/^\/(.*)/, function(req, res, next) {
		var page = req.params[0] || 'index';
		res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		res.render(page + ".html");
	});

}