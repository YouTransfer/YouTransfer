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
restify.cookieSession = require('cookie-session');
restify.compression = require('compression');

// YouTransfer
var youtransfer = require('./lib/youtransfer');
var passport = require('./lib/passport');
var routes = require('./lib/routes');
var middleware = require('./lib/middleware');
var errors = require('./lib/errors');

// ------------------------------------------------------------------------------------------ App Initialization

var app = restify.createServer(); 
app.pre(restify.pre.sanitizePath());
app.use(restify.bodyParser({ multiples: true }));
app.use(restify.queryParser());
app.use(restify.cookieParser.parse);
app.use(restify.compression());
app.use(restify.cookieSession({
	name: 'session',
	secret: nconf.get('ENCRYPTIONKEY') || 'NotSoVerySecretCookieKey',
	expires: new Date().add({ minutes: 20 }),
	secure: (nconf.get('NODE_ENV') == "production"),
	maxAge: 1200000
}));

app.use(errors);
app.use(middleware);
app.use(passport.initialize());
app.use(passport.session());

// ------------------------------------------------------------------------------------------ App Routing

var router = routes('./dist');
app.post('/', router.upload());
app.post('/upload', router.upload());
app.post('/upload/bundle', router.uploadBundle());
app.post(/^\/send/, router.send());
app.get('/download/:token', router.download());
app.post('/download', router.download());
app.get('/bundle/:token', router.download());
app.get('/settings', router.settingsRedirect());
app.post('/settings/finalise', router.settingsFinalise());
app.get('/settings/:name/:template', router.settingsGetTemplateByName());
app.get('/settings/:name', router.settingsGetByName());
app.post('/settings/:name', router.settingsSaveByName());
app.post('/unlock', router.settingsUnlock());
app.post('/login', passport.authenticate('local', { successRedirect: '/' }));
app.get('/signout', router.signout());
app.get(/^(\/v\d*)?\/(js|css|assets|fonts|img|sounds)\/(.*)/, router.staticFiles());
app.get(/^\/(.*)/, router.default());

// ------------------------------------------------------------------------------------------ App Execution

// Start the server
var port = Number(nconf.get('PORT'));
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
	youtransfer.initialize();
});

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = app;
