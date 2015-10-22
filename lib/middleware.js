'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');
var url = require('url');
var nconf = require('nconf');
var nunjucks = require('nunjucks');
var youtransfer = require('./youtransfer');

// ------------------------------------------------------------------------------------------ Module definition

module.exports = function(req, res, next) {

	// Fixing missing parsed body object in Restify (for usage in Passport)
	req.body = req.params;

	// Fix for missing redirect function in Restify
	res.redirect = function(addr) {
		res.header('Location', addr);
		res.send(302);
	};

	// Fix for passport-remember-me strategy's dependency on req.res & res.cookie()
	res.cookie = res.setCookie;
	req.res = res;

	// Add XmlHttpRequest property to request object
	req.isXMLHttpRequest = (req.headers['x-requested-with'] !== null && req.headers['x-requested-with'] === 'XMLHttpRequest');

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
			watch: (nconf.get('NODE_ENV') !== 'production')
		}
	);

	res.renderTemplate = function(name, context, callback) {
		youtransfer.settings.get(function(err, settings) {
			// Assing request parameters and headers as well as application settings to context
			context = _.assign(req.params, req.headers, context);
			context = err ? context : _.assign(settings, context);
			context.isXMLHttpRequest = req.isXMLHttpRequest;
			if(req.errors.exist()) {
				context.errors = context.errors || [];
				context.errors = _.merge(context.errors, req.errors.get());
			}

			// Check to see if host header matches baseUrl
			if(req.headers.host) {
				var requestUrl = (req.socket.encrypted ? 'https://' : 'http://') + req.headers.host;
				var currentUrl = url.parse(requestUrl);
				var baseUrl = url.parse(settings.general.baseUrl);
				context.invalidHost = (currentUrl.host !== baseUrl.host);
				context.host = requestUrl;
			}

			nunjucks.render(name, context, callback);
		});
	};

	res.render = function(name, context, callback) {
		callback = callback || function() {};
		res.setHeader('Server', 'youtransfer.io');

		youtransfer.settings.get(function(err, settings) {
			// Assing request parameters and headers as well as application settings to context
			context = _.assign(req.params, req.headers, context);
			context = err ? context : _.assign(settings, context);
			context.isXMLHttpRequest = req.isXMLHttpRequest;
			context.user = req.user;

			// Add error collection to context
			if(req.errors.exist()) {
				context.errors = context.errors || [];
				context.errors = _.merge(context.errors, req.errors.get());
			}

			// Check to see if host header matches baseUrl
			if(req.headers.host) {
				var requestUrl = (req.socket.encrypted ? 'https://' : 'http://') + req.headers.host;
				var currentUrl = url.parse(requestUrl);
				var baseUrl = url.parse(settings.general.baseUrl);
				context.invalidHost = (currentUrl.host !== baseUrl.host);
				context.host = requestUrl;
			}

			try {
				var template = viewEngine.getTemplate(name);
				if(template.path.match(/\/views\/pages\//)) {
					var output = nunjucks.render(name, context);
					res.setHeader('Content-type', 'text/html');
					res.writeHead(200);
					res.end(output);
				} else {
					throw new Error('The selected template is not a page, throwing "template not found" error for proper handling');
				}
			} catch (err) {
				if(err.message.match(/template not found/)) {
					try {
						var output = nunjucks.render('404.html', context);
						res.setHeader('Content-type', 'text/html');
						res.writeHead(404);
						res.end(output);
					} catch(err) {
						res.writeHead(404);
						res.end('Resource not found');
					}
				} else {
					res.writeHead(500);
					res.end(err.message);
				}
			}

			callback();
		});
	};

	res.process = function(name, context, callback) {
		callback = callback || function() {};

		context = _.assign({
			success: !req.errors.exist(),
			isPostback: (req.method === 'POST'),
			errors: req.errors.get()
		}, context);

		if(!res.finished) {
			if(req.isXMLHttpRequest) {
				res.renderTemplate(name, context, function(err, output) {
					context.output = output;
					res.json(context);
					callback();
				});
			} else {
				res.render(name, context, callback);
			}
		}
	};

	next();
};
