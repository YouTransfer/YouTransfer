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

// Restify
var restify = require('restify');
restify.cookieParser = require('restify-cookies');
restify.compression = require('compression');

// YouTransfer
var routes = require('./lib/routes');
var middleware = require('./lib/middleware');
var youtransfer = require('./lib/youtransfer');

// ------------------------------------------------------------------------------------------ App Initialization

var app = restify.createServer(); 
app.pre(restify.pre.sanitizePath());
app.use(restify.bodyParser());
app.use(restify.queryParser());
app.use(restify.cookieParser.parse);
app.use(restify.compression());
app.use(middleware);

// ------------------------------------------------------------------------------------------ App Routing

app.post('/upload', routes.upload);
app.post('/upload/bundle', routes.uploadBundle);
app.post(/^\/send/, routes.send);
app.get('/download/:token', routes.downloadFile);
app.post(/^\/download/, routes.downloadFile);
app.get('/bundle/:token', routes.downloadBundle);
app.get('/settings', routes.settingsRedirect);
app.post('/settings/finalise', routes.settingsFinalise);
app.get('/settings/template/:name', routes.settingsGetTemplateByName);
app.post('/settings/template/', routes.settingsSaveTemplate);	
app.get('/settings/:name', routes.settingsGetByName);
app.post('/settings/:name', routes.settingsSaveByname);
app.get(/^(\/v\d*)?\/(js|css|assets|fonts|img|sounds)\/(.*)/, routes.staticFiles);
app.get(/^\/(.*)/, routes.default);

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});
