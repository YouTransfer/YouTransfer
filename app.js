'use strict';

// ------------------------------------------------------------------------------------------ App Configuration

// Load configuration
var path = require('path');
var nconf = require('nconf');
nconf.argv()
	 .env()
	 .file('local', { file: path.join(__dirname, 'local.json') })
	 .file({ file: path.join(__dirname, 'config.json') });
nconf.set('basedir', __dirname);

// ------------------------------------------------------------------------------------------ App Dependencies

// Restify
var restify = require('restify');
restify.cookieParser = require('restify-cookies');
restify.compression = require('compression');

// YouTransfer
var routes = require('./lib/routes');
var middleware = require('./lib/middleware');

// ------------------------------------------------------------------------------------------ App Initialization

var app = restify.createServer(); 
app.pre(restify.pre.sanitizePath());
app.use(restify.bodyParser());
app.use(restify.queryParser());
app.use(restify.cookieParser.parse);
app.use(restify.compression());
app.use(middleware);

// ------------------------------------------------------------------------------------------ App Routing

var router = routes('./dist');
app.post('/upload', router.upload());
app.post('/upload/bundle', router.uploadBundle());
app.post(/^\/send/, router.send());
app.get('/download/:token', router.downloadFile());
app.post(/^\/download/, router.downloadFile());
app.get('/bundle/:token', router.downloadBundle());
app.get('/settings', router.settingsRedirect());
app.post('/settings/finalise', router.settingsFinalise());
app.get('/settings/template/:name', router.settingsGetTemplateByName());
app.post('/settings/template/', router.settingsSaveTemplate());	
app.get('/settings/:name', router.settingsGetByName());
app.post('/settings/:name', router.settingsSaveByName());
app.post('/unlock', router.settingsUnlock());
app.get(/^(\/v\d*)?\/(js|css|assets|fonts|img|sounds)\/(.*)/, router.staticFiles());
app.get(/^\/(.*)/, router.default());

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = app;
