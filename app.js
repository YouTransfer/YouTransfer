'use strict';

// ------------------------------------------------------------------------------------------ App Configuration

// Load configuration
var nconf = require('nconf');
nconf.argv()
     .env()
     .file('local', { file: 'local.json' })
     .file({ file: 'config.json' });

// ------------------------------------------------------------------------------------------ App Dependencies

// Restify + node-static + proxy
var nstatic = require('node-static');
var compression = require('compression')
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

// ------------------------------------------------------------------------------------------ App Routing

// Initialize routes
require('./lib/routes.js')(app, nconf);

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});
