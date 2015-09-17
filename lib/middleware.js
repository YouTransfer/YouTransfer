'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');
var nconf = require('nconf');
var nunjucks = require("nunjucks");
var youtransfer = require('./youtransfer');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = function(req, res, next) {

	// Fix for missing redirect function in Restify
	res.redirect = function(addr) { 
		res.header('Location', addr); 
		res.send(302); 
	} 

	// Add XmlHttpRequest property to request object
	req.isXmlHtppRequest = (req.headers['x-requested-with'] && req.headers['x-requested-with'] == 'XMLHttpRequest');

	// Initializing Nunjucks template engine + adding it to Restify
	var viewEngine = nunjucks.configure([
		'./src/views/', 
		'./src/views/partials', 
		'./src/views/pages', 
		'./src/views/errors', 
		'./src/templates/'
		], 
		{
			autoescape: true,
			watch: (nconf.get('NODE_ENV') != "production")
		}
	);

	res.renderTemplate = function(name, context, callback) {
		youtransfer.settings.get(function(err, settings) {
			context = err ? context : _.assign(settings, context);
			nunjucks.render(name, context, callback);
		});
	};

	res.render = function(name, context, callback) {
		res.setHeader('Server', 'youtransfer.io');

		youtransfer.settings.get(function(err, settings) {
			context = err ? context : _.assign(settings, context);
			context.isXmlHtppRequest = req.isXmlHtppRequest;

			try {
				var template = viewEngine.getTemplate(name);
				if(template.path.match(/\/views\/pages\//)) {
					var output = nunjucks.render(name, context, callback);
					res.setHeader('Content-type', 'text/html');
					res.writeHead(200);
					res.end(output);
				} else {
					throw new Error("The selected template is not a page, throwing 'template not found' error for proper handling");
				}
			} catch (err) {
				if(err.message.match(/template not found/)) {
					try {
						var output = nunjucks.render("404.html", context);
						res.setHeader('Content-type', 'text/html');
						res.writeHead(404);
						res.end(output);
					} catch(err) {
						res.writeHead(404);
						res.end("Resource not found");
					}
				} else {
					res.writeHead(500);
					res.end(err.message);
				}
			}
		});
	};

	next();
}
