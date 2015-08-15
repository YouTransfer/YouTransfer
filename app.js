'use strict';

// ------------------------------------------------------------------------------------------ App Configuration

// Load configuration
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: 'local.json' })
	 .file({ file: 'config.json' });

// ------------------------------------------------------------------------------------------ App Dependencies

var fs = require("fs");
var _ = require("lodash");

// Restify + node-static + proxy
var nstatic = require('node-static');
var compression = require('compression')
var nunjucks = require("nunjucks");
var restify = require('restify');
restify.cookieParser = require('restify-cookies');

// ------------------------------------------------------------------------------------------ App Initialization

var app = restify.createServer(); 
app.static = new nstatic.Server('./dist');
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
nunjucks.configure(['src/views/', 'src/views/partials', 'src/views/pages', 'src/views/errors'], {
	autoescape: true,
	watch: (nconf.get('NODE_ENV') != "production")
});
app.use(function(req, res, next) {
	res.render = function(name, context, callback) {
		res.setHeader('Server', 'youtransfer.io');

		try {
			var settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8')) || {};
			context = _.assign(settings, context);
		} catch (err) {	}

		try {
			var output = nunjucks.render(name, context, callback);
			res.setHeader('Content-type', 'text/html');
			res.writeHead(200);
			res.end(output);
		} catch (err) {
			if(err.message.match(/template not found/)) {
				try {
					var output = nunjucks.render("404.html");
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
	};
	next();
});

// ------------------------------------------------------------------------------------------ App Routing

// Initialize routes
require('./lib/routes.js')(app, nconf);

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});
