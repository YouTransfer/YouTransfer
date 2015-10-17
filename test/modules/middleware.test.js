'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var sinon = require('sinon');
var should = require('chai').should();
var middleware = require('../../lib/middleware');

// ------------------------------------------------------------------------------------------ Mock Dependencies

var errors = require('../../lib/errors');
var youtransfer = require('../../lib/youtransfer');
var nunjucks = require('nunjucks');
var nconf = require('nconf');
nconf.argv()
	 .env();
nconf.set('basedir', __dirname);

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Middleware module', function() {
	var sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	})

	// -------------------------------------------------------------------------------------- Testing res.redirect

	it('should implement "res.redirect" method', function(done) {
		var location = 'http://github.com/remie/YouTransfer';

		var req = {
			headers: []
		}
		var res = {
			header: function() {},
			send: function() {},
		};

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		var resMock = sandbox.mock(res);
		resMock.expects("header").once().withArgs('Location', location);
		resMock.expects("send").once().withArgs(302);

		middleware(req, res, function() {
			should.exist(res.redirect);
			res.redirect(location);
			resMock.verify();
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing req.isXmlHttpRequest

	it('should add "isXmlHttpRequest" property to response object with value "true"', function(done) {
		var res = {},
			req = {
				headers: {
					'x-requested-with': 'XMLHttpRequest'
				}
			}

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		middleware(req, res, function() {
			should.exist(req.isXMLHttpRequest);
			req.isXMLHttpRequest.should.equals(true);
			done();
		});
	});

	it('should add "isXmlHttpRequest" property to response object with value "false"', function(done) {
		var res = {},
			req = {
				headers: {
					'x-requested-with': ''
				}
			}

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		middleware(req, res, function() {
			should.exist(req.isXMLHttpRequest);
			req.isXMLHttpRequest.should.equals(false);
			done();
		});
	});	

	// -------------------------------------------------------------------------------------- Testing res.renderTemplate	

	it('should implement "res.renderTemplate" method', function(done) {
		var name = 'MyTemplate',
			settings = {},
			res = {},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: []
			},
			context = {
				isXMLHttpRequest: false
			};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		sandbox.stub(nunjucks, 'render', function (template, variables, callback) {
			template.should.equals(name);
			variables.isXMLHttpRequest.should.equals(context.isXMLHttpRequest);
			callback();
		});

		middleware(req, res, function() {
			should.exist(res.renderTemplate);
			res.renderTemplate(name, settings, function() {
				done();
			});
		});
	});	

	it('should implement "res.renderTemplate" method with valid host', function(done) {
		var name = 'MyTemplate',
			settings = {
				general: {
					baseUrl: 'http://myhost'
				}
			},
			res = {},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'myhost'
				},
				socket: {}
			},
			context = {
				general: {
					baseUrl: 'http://myhost'
				},
				host: 'http://myhost',
				invalidHost: false,
				isXMLHttpRequest: false
			};


		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(false);

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		sandbox.stub(nunjucks, 'render', function (template, variables, callback) {
			template.should.equals(name);
			variables.general.baseUrl.should.equals(context.general.baseUrl);
			variables.host.should.equals(context.host);
			variables.invalidHost.should.equals(context.invalidHost);
			variables.isXMLHttpRequest.should.equals(context.isXMLHttpRequest);
			callback();
		});

		middleware(req, res, function() {
			should.exist(res.renderTemplate);
			res.renderTemplate(name, settings, function() {
				done();
			});
		});
	});	

	it('should implement "res.renderTemplate" method with invalid host', function(done) {
		var name = 'MyTemplate',
			settings = {
				general: {
					baseUrl: 'http://myhost'
				}
			},
			res = {},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'anotherhost'
				},
				socket: {}
			},
			context = {
				general: {
					baseUrl: 'http://myhost'
				},
				host: 'http://anotherhost',
				invalidHost: true,				
				isXMLHttpRequest: false
			};


		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		sandbox.stub(nunjucks, 'render', function (template, variables, callback) {
			template.should.equals(name);
			variables.general.baseUrl.should.equals(context.general.baseUrl);
			variables.host.should.equals(context.host);
			variables.invalidHost.should.equals(context.invalidHost);
			variables.isXMLHttpRequest.should.equals(context.isXMLHttpRequest);
			callback();
		});

		middleware(req, res, function() {
			should.exist(res.renderTemplate);
			res.renderTemplate(name, settings, function() {
				done();
			});
		});
	});	

	it('should implement "res.renderTemplate" method with invalid host using SSL', function(done) {
		var name = 'MyTemplate',
			settings = {
				general: {
					baseUrl: 'https://myhost'
				}
			},
			res = {},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'anotherhost'
				},
				socket: {
					encrypted: true
				}
			},
			context = {
				general: {
					baseUrl: 'https://myhost'
				},
				host: 'https://anotherhost',
				invalidHost: true,				
				isXMLHttpRequest: false
			};


		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		sandbox.stub(nunjucks, 'render', function (template, variables, callback) {
			template.should.equals(name);
			variables.general.baseUrl.should.equals(context.general.baseUrl);
			variables.host.should.equals(context.host);
			variables.invalidHost.should.equals(context.invalidHost);
			variables.isXMLHttpRequest.should.equals(context.isXMLHttpRequest);
			callback();
		});

		middleware(req, res, function() {
			should.exist(res.renderTemplate);
			res.renderTemplate(name, settings, function() {
				done();
			});
		});
	});	

	it('should implement "res.renderTemplate" method which does not throw an error if settings are not available', function(done) {
		var name = 'MyTemplate',
			settings = {},
			res = {},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: []
			},
			context = {
				isXMLHttpRequest: false
			};

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback('error', null);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		//Adding stub to avoid test execution getting blocked by Nunjucks fs watch
		sandbox.stub(nunjucks, 'configure').returns(null);

		sandbox.stub(nunjucks, 'render', function (template, variables, callback) {
			template.should.equals(name);
			variables.isXMLHttpRequest.should.equals(context.isXMLHttpRequest);
			callback();
		});

		middleware(req, res, function() {
			should.exist(res.renderTemplate);
			res.renderTemplate(name, settings, function() {
				done();
			});
		});
	});

	// -------------------------------------------------------------------------------------- Testing res.render

	it('should implement "res.render" method', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/pages/MyTemplate.html',
				content: 'this is my template'
			},
			settings = {},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: []
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(200);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (name, context, callback) {
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method with valid host', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/pages/MyTemplate.html',
				content: 'this is my template'
			},
			settings = {
				general: {
					baseUrl: 'http://myhost'
				}
			},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'myhost'
				},
				socket: {}
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(200);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(false);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (name, context, callback) {
			context.invalidHost.should.equals(false);
			context.general.baseUrl.should.equals(settings.general.baseUrl);
			context.host.should.equals(settings.general.baseUrl);
			context.isXMLHttpRequest.should.equals(false);
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method with valid host using SSL', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/pages/MyTemplate.html',
				content: 'this is my template'
			},
			settings = {
				general: {
					baseUrl: 'https://myhost'
				}
			},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'myhost'
				},
				socket: {
					encrypted: true
				}
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(200);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (name, context, callback) {
			context.invalidHost.should.equals(false);
			context.general.baseUrl.should.equals(settings.general.baseUrl);
			context.host.should.equals(settings.general.baseUrl);
			context.isXMLHttpRequest.should.equals(false);
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method with invalid host', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/pages/MyTemplate.html',
				content: 'this is my template'
			},
			settings = {
				general: {
					baseUrl: 'http://myhost'
				}
			},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				params: {},
				headers: {
					host: 'anotherhost'
				},
				socket: {}
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(200);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (name, context, callback) {
			context.invalidHost.should.equals(true);
			context.general.baseUrl.should.equals(settings.general.baseUrl);
			context.host.should.equals('http://anotherhost');
			context.isXMLHttpRequest.should.equals(false);
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method which does not break when settings retrieval fails', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/pages/MyTemplate.html',
				content: 'this is my template'
			},
			settings = {},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: [],
				params: {}
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(200);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback('this is an error', {});
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (name, context, callback) {
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method and return a meaningful 404 if template is not found but error page exists', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/partial/MyTemplate.html',
				content: 'this is a 404 page'
			},
			settings = {},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: []
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("setHeader").once().withArgs('Content-type', 'text/html');
		resMock.expects("writeHead").once().withArgs(404);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render', function (templateName, context, callback) {
			return template.content;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method and return a meaningless 404 if template is not found and error page does not exist', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/partial/MyTemplate.html',
				content: 'Resource not found'
			},
			settings = {},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: []
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("writeHead").once().withArgs(404);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).returns(template);

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(nunjucks, 'render').throws('some random error');

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.content);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	it('should implement "res.render" method and return a 500 error message if things go south', function(done) {
		var name = 'MyTemplate',
			template = {
				path: __dirname + '/views/partial/MyTemplate.html',
				content: 'Resource not found',
				err: new Error('some random error')
			},
			settings = {},
			res = {
				setHeader: function() {},
				writeHead: function() {},
				end: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: []
			},
			viewEngine = {
				getTemplate: function() {}
			}

		var resMock = sandbox.mock(res);
		resMock.expects("setHeader").once().withArgs('Server', 'youtransfer.io');
		resMock.expects("writeHead").once().withArgs(500);

		var viewEngineMock = sandbox.mock(viewEngine);
		viewEngineMock.expects("getTemplate").once().withArgs(name).throws(template.err)

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(req.errors, 'exist').returns(true);

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		sandbox.stub(res, 'end', function (content) {
			should.exist(content);
			content.should.equals(template.err.message);
		});

		middleware(req, res, function() {
			should.exist(res.render);
			res.render(name, settings, null);

			resMock.verify();
			viewEngineMock.verify();
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing res.process

	it('should implement "res.process" method which results in template rendering', function(done) {
		var name = 'MyTemplate',
			context = {
				success: true,
				isPostback: true,
				errors: []
			},
			res = {
				render: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: []
			},
			viewEngine = {
				getTemplate: function() {}
			};

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		middleware(req, res, function() {
			should.exist(res.process);

			sandbox.stub(req.errors, 'exist').returns(true);

			sandbox.stub(res, 'render', function (template, variables, callback) {
				template.should.equals(name);
				variables.success.should.equals(context.success);
				variables.isPostback.should.equals(context.isPostback);
				variables.errors.should.equals(context.errors);
				callback();
			});

			res.process(name, context, done);
		});
	});	

	it('should implement "res.process" method which results in JSON response', function(done) {
		var name = 'MyTemplate',
			context = {
				success: true,
				isPostback: true,
				errors: []
			},
			res = {
				json: function() {}
			},
			req = {
				params: {},
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: {
					'x-requested-with': 'XMLHttpRequest'
				}
			},
			viewEngine = {
				getTemplate: function() {}
			};

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		middleware(req, res, function() {
			should.exist(res.process);

			sandbox.stub(req.errors, 'exist').returns(true);

			sandbox.stub(res, 'renderTemplate', function (template, variables, callback) {
				callback(null, 'my template content');
			});

			sandbox.stub(res, 'json', function (variables) {
				variables.success.should.equals(context.success);
				variables.isPostback.should.equals(context.isPostback);
				variables.errors.should.equals(context.errors);
				variables.output.should.equals('my template content');
			});

			res.process(name, context, done);
		});
	});	

	it('should implement "res.process" method which results in JSON response without callback', function(done) {
		var name = 'MyTemplate',
			context = {
				success: true,
				isPostback: true,
				errors: []
			},
			res = {
				json: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: {
					'x-requested-with': 'XMLHttpRequest'
				}
			},
			viewEngine = {
				getTemplate: function() {}
			};

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		middleware(req, res, function() {
			should.exist(res.process);

			sandbox.stub(req.errors, 'exist').returns(true);

			sandbox.stub(res, 'renderTemplate', function (template, variables, callback) {
				callback(null, 'my template content');
			});

			sandbox.stub(res, 'json', function (variables) {
				variables.success.should.equals(context.success);
				variables.isPostback.should.equals(context.isPostback);
				variables.errors.should.equals(context.errors);
				variables.output.should.equals('my template content');
				done();
			});

			res.process(name, context);
		});
	});	

	it('should implement "res.process" method which does not return any result if the response stream has already finished', function(done) {
		var name = 'MyTemplate',
			context = {
				success: true,
				isPostback: true,
				errors: []
			},
			res = {
				finished: true,
				json: function() {}
			},
			req = {
				errors: {
					get: function() {},
					exist: function() {}
				},
				headers: {
					'x-requested-with': 'XMLHttpRequest'
				}
			},
			viewEngine = {
				getTemplate: function() {}
			};

		sandbox.stub(nunjucks, 'configure', function (files, options) {
			return viewEngine;
		});

		middleware(req, res, function() {
			should.exist(res.process);

			var resMock = sandbox.mock(res);
			resMock.expects("json").never();

			res.process(name, context, null);

			resMock.verify();
			done();
		});
	});		

});
