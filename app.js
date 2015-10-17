
var restify = require('restify');
var nstatic = require('node-static');

var app = restify.createServer(); 
app.fileServer = new nstatic.Server('.');

app.get(/^\/.*/, function(req, res, next) {
    app.fileServer.serve(req, res);
});

// Start the server
var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log('%s listening at %s', app.name, app.url);
});
