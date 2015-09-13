'use strict';

// ------------------------------------------------------------------------------------------ App Configuration

// Load configuration
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: 'local.json' })
	 .file({ file: 'config.json' });
nconf.set('basedir', __dirname);

// ------------------------------------------------------------------------------------------ App Dependencies

var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var scheduler = require('./lib/scheduler.js');
var youtransfer = require('./lib/youtransfer.js');

// Restify + node-static + proxy
var nstatic = require('node-static');
var compression = require('compression')
var nunjucks = require("nunjucks");
var restify = require('restify');
restify.cookieParser = require('restify-cookies');

// ------------------------------------------------------------------------------------------ App Initialization

var app = restify.createServer(); 
app.static = new nstatic.Server('./dist');
app.pre(restify.pre.sanitizePath());
app.use(restify.bodyParser());
app.use(restify.queryParser());
app.use(restify.cookieParser.parse);
app.use(compression());

// Fix for missing redirect function in Restify
app.use(function(req,res,next) {
	res.redirect = function(addr) { 
		res.header('Location', addr); 
		res.send(302); 
	} 
	next();
});

// Initializing Nunjucks template engine + adding it to Restify
app.viewEngine = nunjucks.configure(['src/views/', 'src/views/partials', 'src/views/pages', 'src/views/errors', 'src/templates/'], {
	autoescape: true,
	watch: (nconf.get('NODE_ENV') != "production")
});

app.use(function(req, res, next) {
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
			context.isXmlHtppRequest = (req.headers['x-requested-with'] && req.headers['x-requested-with'] == 'XMLHttpRequest');

			try {
				var template = app.viewEngine.getTemplate(name);
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
});

// ------------------------------------------------------------------------------------------ App Routing

// Initialize routes
require('./lib/routes.js')(app, nconf);

// ------------------------------------------------------------------------------------------ App Scheduling

youtransfer.settings.get(function(err, settings) {
	if(!err) {
		scheduler.add('cleanup', settings.cleanupSchedule, youtransfer.cleanup);
		youtransfer.on('settings.push', function(err, data) {
			scheduler.reschedule('cleanup', data.cleanupSchedule, youtransfer.cleanup);
		});
	}
});

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});


