'use strict';

var fs = require("fs");
var mime = require('mime');
var _ = require("lodash");
var md5 = require("md5");

module.exports = function(app, nconf) {


	app.post(/^\/upload/, function(req, res, next) {

		var file = req.files.payload;
		var fileId = md5(file.name + (Math.random() * 1000));
		var fileMetaData = JSON.stringify({
			id: fileId,
			name: file.name,
			size: file.size,
			type: file.type,
			lastModifiedDate: file.lastModifiedDate
		});

		var destFile = './uploads/' + fileId + '.binary';
		var destFileJson = './uploads/' + fileId + '.json';

		fs.mkdir('./uploads', function() {
			fs.readFile(file.path, function (err, data) {
				if(err) { console.log(err); }
				fs.writeFile(destFile, data, function(err) {
					if(err) { console.log(err); }
					fs.writeFile(destFileJson, fileMetaData, 'utf-8', function(err) {
						if(err) { console.log(err); }
						res.redirect("/");
					});
				});
			});
		});
	});

	app.post(/^\/download/, function(req, res, next) {
		var token = req.params.token;

		try {
			var metadata = require('../uploads/' + token + '.json');
			if(metadata) {

				var file = __dirname + '/../uploads/' + token + '.binary';
				var mimetype = mime.lookup(file) || metadata.type;

				res.setHeader('Content-disposition', 'attachment; filename=' + metadata.name);
				res.setHeader('Content-length', metadata.size);
				res.setHeader('Content-type', mimetype);

				var filestream = fs.createReadStream(file);
				filestream.pipe(res);
			}
		} catch (exp) { 
			res.redirect("/");
		}
	});

	// ------------------------------------------------------------------------------------------ Static Server routes

	// Service static resources
	app.get(/^(\/v\d*)?\/(js|css|fonts|img|sounds)\/(.*)/, function(req, res, next) {
		app.static.serveFile('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);
	});

	// ------------------------------------------------------------------------------------------ Redirect all other routes to client-side

	// Serve home page
	app.get(/^\/.*/, function(req, res, next) {
	    app.static.serveFile('/index.html', 200, { server: 'youtransfer.io', 'Cache-Control': 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate' }, req, res);
	});

}