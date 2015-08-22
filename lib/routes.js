'use strict';

var _ = require("lodash");
var youtransfer = require("./youtransfer.js");

module.exports = function(app, nconf) {

	app.post(/^\/upload/, function(req, res, next) {
		var settings = youtransfer.settings.get();
		var isXmlHtppRequest = req.files['dz-payload'];
		var file = req.files.payload || req.files['dz-payload'];
		youtransfer.upload(file, function(err, context) {
			var response = _.assign({
				success: _.isNull(err),
				isPostback: true, 
				isXmlHtppRequest: _.isNull(isXmlHtppRequest) ? false : true,
				link: settings.baseUrl + '/download/' + context.id + '/',
				error: (err ? err.message : '')
			}, context);

			if(isXmlHtppRequest) {
				res.json(response);
			} else {
				res.render("index.html", response);
			}
		});
	});

	app.get(/^\/download\/(.*)\//, function(req, res, next) {
		var token = req.params[0];
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

	app.get(/^\/settings\/dropzone/, function(req, res, next) {
		var settings = youtransfer.settings.get();
		var output = settings.dropzone || {};
		res.json(output);
	});

	app.post(/^\/settings/, function(req, res, next) {
		var settings = req.params["settings"];
		youtransfer.settings.push(settings, function(err) {
			res.setHeader('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
			res.render("settings.html", {
				isPostback: true,
				success: _.isNull(err),
				isXmlHtppRequest: (req.headers['x-requested-with'] && req.headers['x-requested-with'] == 'XMLHttpRequest')
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