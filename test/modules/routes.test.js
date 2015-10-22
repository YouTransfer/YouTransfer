'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var _ = require('lodash');
var sinon = require('sinon');
var should = require('chai').should();
var errors = require('../../lib/errors');
var routes = require('../../lib/routes');
var router = routes('./dist');

var nconf = require('nconf');
nconf.argv()
	 .env();
nconf.set('basedir', __dirname);

// ------------------------------------------------------------------------------------------ Mock Dependencies

var nstatic = require('node-static');
var youtransfer = require('../../lib/youtransfer');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Router module', function() {

	var sandbox;

	// -------------------------------------------------------------------------------------- Test Initialization

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should accept options by Object', function() {
		var instance = routes({ fileServer: 'My Awesome Fileserver' });
		instance.fileServer.should.equals('My Awesome Fileserver');
	});

	it('should accept options by Null Object', function() {
		var instance = routes(null);
		should.exist(instance.fileServer);
		instance.fileServer.serverInfo.should.equals('node-static/0.7.7');
	});

	it('should accept options by empty Object', function() {
		var instance = routes({});
		should.exist(instance.fileServer);
		instance.fileServer.serverInfo.should.equals('node-static/0.7.7');
	});

	it('should accept options by String', function() {
		var instance = routes('./path');
		should.exist(instance.fileServer);
		instance.fileServer.serverInfo.should.equals('node-static/0.7.7');
	});

	it('should throw an error when setting options by Integer', function() {
		try {
			var instance = routes(100);
			should.not.exist(instance);
		} catch(err) {
			should.exist(err);
			err.should.equals('Invalid options provided');
		}
	});

	// -------------------------------------------------------------------------------------- Testing upload

	it('should be possible to upload without using dropzone', function(done) {
		
		var req = {
				files: {
					payload: 'file'
				},
				params: {},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			context = {
				id: 'token'
			},
			response = {
				bundle: { files: [{ id: context.id }] }
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'upload', function (file, bundle, callback) {
			should.exist(file);
			should.exist(bundle);
			file.should.equals(req.files.payload);
			response.bundle.id = bundle.id;
			callback(null, context);
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			should.exist(bundle);
			should.exist(bundle.id);
			should.exist(bundle.files[0])
			bundle.id.should.equals(response.bundle.id);
			bundle.files[0].id.should.equals(context.id);
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", response).callsArg(2);

		router.upload()(req, res, function() {
			resMock.verify();
			done();
		});
	});

	it('should be possible to upload multiple files without using dropzone', function(done) {
		
		var req = {
				files: {
					payload: [ 'file1', 'file2' ]
				},
				params: {},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			context = {
				id: 'token'
			},
			response = {
				bundle: { files: [{ id: context.id }, { id: context.id }] }
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'upload', function (file, bundle, callback) {
			should.exist(file);
			should.exist(bundle);
			file.should.match(/file1|file2/	);
			response.bundle.id = bundle.id;
			callback(null, context);
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			should.exist(bundle);
			should.exist(bundle.id);
			should.exist(bundle.files[0])
			should.exist(bundle.files[1])
			bundle.id.should.equals(response.bundle.id);
			bundle.files[0].id.should.equals(context.id);
			bundle.files[1].id.should.equals(context.id);
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", response).callsArg(2);

		router.upload()(req, res, function() {
			resMock.verify();
			done();
		});
	});
	it('should be possible to upload using dropzone', function(done) {
		
		var req = {
				files: {
					'dz-payload': 'file'
				},
				params: {
					bundle: 'bundle'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {},
			},
			context = {
				id: 'token'
			},
			response = {
				bundle: { files: [{ id: context.id }] }
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'upload', function (file, bundle, callback) {
			should.exist(file);
			should.exist(bundle);
			file.should.equals(req.files['dz-payload']);
			response.bundle.id = bundle.id;
			callback(null, context);
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			should.exist(bundle);
			should.exist(bundle.id);
			should.exist(bundle.files[0])
			bundle.id.should.equals(response.bundle.id);
			bundle.files[0].id.should.equals(context.id);
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", response).callsArg(2);

		router.upload()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});

	it('should provide feedback if errors occur while uploading', function(done) {
		
		var req = {
				files: {
					payload: 'file'
				},
				params: {
					bundle: 'bundle'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			context = {
				id: 'token'
			},
			response = {
				bundle: { files: [{ id: "token" }], id: "bundle" }
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'upload', function (file, bundle, callback) {
			callback(new Error('error'), context);
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.upload()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An error occurred while uploading your file(s).");
			done();
		});
	});	

	it('should provide feedback if multiple errors occur while uploading', function(done) {
		
		var req = {
				files: {
					payload: [ 'file1', 'file2' ]
				},
				params: {
					bundle: 'bundle'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			context = {
				id: 'token'
			},
			response = {
				bundle: { files: [{ id: "token" }], id: "bundle" }
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'upload', function (file, bundle, callback) {
			callback(new Error('error'), context);
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.upload()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An error occurred while uploading your file(s).");
			done();
		});
	});	

	// -------------------------------------------------------------------------------------- Testing uploadBundle

	it('should be possible to upload bundle', function(done) {

		var req = {
				params: {
					bundle: JSON.stringify({
						id: 'bundle'
					})
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {},
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			callback(null);
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.uploadBundle()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		})

	});

	it('should provide feedback if errors occur while uploading bundle', function(done) {

		var req = {
				params: {
					bundle: JSON.stringify({
						id: 'bundle'
					})
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {},
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			callback(new Error("error"));
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.uploadBundle()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An error occurred while uploading your file(s)");
			done();
		});

	});

	it('should provide feedback if errors occur while parsing uploaded bundle', function(done) {

		var req = {
				params: {
					bundle: 'this is not JSON'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {},
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				general: {
					baseUrl: ''
				}
			});
		});

		sandbox.stub(youtransfer, 'bundle', function (bundle, callback) {
			callback(new Error("error"));
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.uploadBundle()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An error occurred while uploading your file(s)");
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing send

	it('should be possible to send an email', function(done) {
		var req = {},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer, 'send', function (req, res, callback) {
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs("index.html", null).callsArg(2);

		router.send()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});

	////////////////////////////////////////////////
	// TODO: create test for ERRORS WHILE SENDING //
	////////////////////////////////////////////////

	// -------------------------------------------------------------------------------------- Testing downloadFile

	it('should be possible to download a file', function(done) {
		var req = {
				params: {
					token: 'token'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer, 'download', function (token, res, callback) {
			should.exist(token);
			token.should.equals(req.params.token);
			callback();
		});

		sandbox.stub(res, "process", function (name, context, callback) {
			name.should.equals('download.html');
			should.not.exist(context);
			callback();
		});

		router.download()(req, res, function() {
			req.errors.exist().should.equals(false);
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing downloadBundle

	it('should be possible to download a bundle', function(done) {
		var req = {
				params: {
					token: '00000000-0000-0000-0000-000000000000'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer, 'archive', function (token, res, callback) {
			should.exist(token);
			token.should.equals(req.params.token);
			callback();
		});

		sandbox.stub(res, "process", function (name, context, callback) {
			req.errors.exist().should.equals(false);
			name.should.equals('download.html');
			should.not.exist(context);
			callback();
		});

		router.download()(req, res, done);
	});

	// -------------------------------------------------------------------------------------- Testing settingsRedirect

	it('should redirect to general settings page if no page is specified', function() {
		var req = {},
			res = {
				redirect: function() {}
			}

		errors(req, null, function() {});

		var resMock = sandbox.mock(res);
		resMock.expects("redirect").once().withArgs('/settings/general');

		router.settingsRedirect()(req, res);

		req.errors.exist().should.equals(false);
		resMock.verify();

	});

	// -------------------------------------------------------------------------------------- Testing settingsFinalise

	it('should be possible to finalise settings', function(done) {

		var req = {
				params: {
					settings: {
						state: {
							unlockCode: 'MySecretCode'
						}
					}
				}
			},
			res = {
				redirect: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'finalise', function (code, callback) {
			should.exist(code);
			code.should.equals(req.params.settings.state.unlockCode);
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("redirect").once();

		router.settingsFinalise()(req, res, function() {
			resMock.verify();
			done();
		});

	});

	it('should provide feedback when an error occurs while trying to finalise settings', function(done) {

		var req = {
				params: {
					settings: {
						state: {
							unlockCode: 'MySecretCode'
						}
					}
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'finalise', function (code, callback) {
			should.exist(code);
			code.should.equals(req.params.settings.state.unlockCode);
			callback(new Error('error'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs('settings.finalise.html', null).callsArgAsync(2);

		router.settingsFinalise()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An unknown error occurred while finalising the settings. Please try again.");
			done();
		});

	});

	// -------------------------------------------------------------------------------------- Testing settingsUnlock

	it('should be possible to unlock settings', function(done) {

		var req = {
				params: {
					unlockCode: 'MySecretCode'
				}
			},
			res = {
				redirect: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'unlock', function (code, callback) {
			should.exist(code);
			code.should.equals(req.params.unlockCode);
			callback();
		});

		var resMock = sandbox.mock(res);
		resMock.expects("redirect").once();

		router.settingsUnlock()(req, res, function() {
			resMock.verify();
			done();
		});

	});

	it('should not be possible to unlock settings if code is incorrect', function(done) {
		var req = {
				params: {
					unlockCode: 'MySecretCode'
				}
			},
			res = {
				process: function() {}
			},
			settings = {
				state: {
					finalised: true,
					unlockCode: 'MyOtherCode'
				}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'unlock', function (code, callback) {
			should.exist(code);
			code.should.equals(req.params.unlockCode);
			callback(new Error('INVALID_CODE'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects("process").once().withArgs('unlock.html', null).callsArg(2);

		router.settingsUnlock()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("The unlock code is invalid. Please try again");
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing settingsGetTemplateByName

	it('should be possible to get template source', function(done) {

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate'
				}
			},
			res = {
				on: function() {},
				setHeader: function() {},
				send: function() {},
				end: function() {},
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'get', function (name, callback) {
			should.exist(name);
			name.should.equals(req.params.template);
			callback(null, 'source');
		});

		var resMock = sandbox.mock(res);
		resMock.expects('on').once().callsArgAsync(1);
		resMock.expects('setHeader').once().withArgs('Content-Type', 'text/html');
		resMock.expects('setHeader').once().withArgs('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		resMock.expects('send').once().withArgs('source');
		resMock.expects('end').once();

		router.settingsGetTemplateByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		})
	});

	it('should provide feedback when trying to get template source if settings are finalised', function(done) {

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'get', function (name, callback) {
			should.exist(name);
			name.should.equals(req.params.template);
			callback(new Error('SETTINGS_FINALISED'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.template.html', null).callsArg(2);

		router.settingsGetTemplateByName()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("The settings are currently locked. Please unlock them if you wish to make changes.");
			done();
		})
	});	

	it('should provide feedback if an error occures while trying to read template source', function(done) {

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'get', function (name, callback) {
			should.exist(name);
			name.should.equals(req.params.template);
			callback(new Error('Error'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.template.html', null).callsArg(2);

		router.settingsGetTemplateByName()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An error occurred while trying to retrieve the template");
			done();
		})
	});	

	it('should provide feedback if template does not exist', function(done) {

		var req = {
				params: {}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'get', function (name, callback) {
			should.not.exist(name);
			callback(new Error('ENOENT'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.template.html', null).callsArg(2);

		router.settingsGetTemplateByName()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An invalid template has been selected. Please try again.");
			done();
		})
	});	

	// -------------------------------------------------------------------------------------- Testing settingsSaveTemplate

	it('should be possible to set template source', function(done) {

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate',
					body: 'this is my template'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'push', function (name, content, callback) {
			should.exist(name);
			should.exist(content);
			name.should.equals(req.params.template);
			content.should.equals(req.params.body);
			callback(null);
		});

		sandbox.stub(router, "settingsGetByName", function() {
			return function(req, res, next) {
				should.exist(req.params.name);
				req.params.name.should.equals('template');
				next();
			};
		});

		router.settingsSaveTemplate()(req, res, function() {
			req.errors.exist().should.equals(false);
			done();
		});
	});

	it('should provide feedback when trying to set template source if settings have been finalised', function(done) {

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate',
					body: 'this is my template'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		var req = {
				params: {
					name: 'template',
					template: 'someTemplate',
					body: 'this is my template'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'push', function (name, content, callback) {
			should.exist(name);
			should.exist(content);
			name.should.equals(req.params.template);
			content.should.equals(req.params.body);
			callback(new Error('SETTINGS_FINALISED'));
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.template.html', null).callsArg(2);

		router.settingsSaveTemplate()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("The settings are currently locked. Please unlock them if you wish to make changes.");
			done();
		});
	});

	it('should not be possible to set template source if no template name was provided', function(done) {

		var req = {
				params: {
					name: 'template',
					body: 'this is my template'
				}
			},
			res = {
				process: function() {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.templates, 'push', function (name, content, callback) {
			should.not.exist(name);
			should.exist(content);
			content.should.equals(req.params.body);
			callback(new Error('ENOENT'));
		});

		sandbox.stub(router, "settingsGetByName", function() {
			return function(req, res, next) {
				should.exist(req.params.name);
				req.params.name.should.equals('template');
				next();
			};
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.template.html', null).callsArg(2);

		router.settingsSaveTemplate()(req, res, function() {
			resMock.verify();
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("An invalid template has been selected. Please try again.");
			done();
		});
	});

	// -------------------------------------------------------------------------------------- Testing settingsGetByName

	it('should be possible to retrieve settings pages', function(done) {

		var req = {
				params: {
					name: 'general'
				}
			},
			res = {
				process: function() {}
			},
			response = {
				activeTab: req.params.name
			};

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				state: {
					finalised: false
				}
			});
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.' + req.params.name + '.html', response).callsArg(2);

		router.settingsGetByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});

	it('should be possible to retrieve general settings page if no specific page was provided', function(done) {

		var req = {
				params: {}
			},
			res = {
				process: function() {}
			},
			response = {
				activeTab: 'general'
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				state: {
					finalised: false
				}
			});
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.general.html', response).callsArg(2);

		router.settingsGetByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});	

	it('should be possible to retrieve dropzone settings', function(done) {

		var req = {
				params: {
					name: 'dropzone'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			settings = {
				state: {
					finalised: false
				}
			},
			response = {
				activeTab: 'dropzone',
				dropzone: {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.dropzone.html', response).callsArg(2);

		router.settingsGetByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});	

	it('should be possible to retrieve dropzone settings even if there is no default setting present', function(done) {

		var req = {
				params: {
					name: 'dropzone'
				},
				isXMLHttpRequest: true
			},
			res = {
				process: function() {}
			},
			settings = {
				state: {
					finalised: false
				}
			},
			response = {
				activeTab: 'dropzone',
				dropzone: {}
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('settings.dropzone.html', response).callsArg(2);

		router.settingsGetByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});	

	it('should not be possible to retrieve settings pages if settings have been finalised', function(done) {

		var req = {
				params: {
					name: 'general'
				}
			},
			res = {
				process: function() {}
			},
			response = {
				activeTab: 'general'
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, {
				state: {
					finalised: true
				}
			});
		});

		var resMock = sandbox.mock(res);
		resMock.expects('process').once().withArgs('404.html', response).callsArg(2);

		router.settingsGetByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});	

	// -------------------------------------------------------------------------------------- Testing settingsSaveByName

	it('should be possible to save settings by name', function(done) {

		var req = {
				params: {
					name: 'general',
					settings: {}
				}
			},
			res = {
				render: function() {}
			},
			settings = {
				state: {
					finalised: false
				}
			},
			response = {
				activeTab: req.params.name
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'get', function (callback) {
			callback(null, settings);
		});

		sandbox.stub(youtransfer.settings, 'push', function (settings, callback) {
			should.exist(settings);
			settings.should.equals(req.params.settings);
			callback(null);
		});

		sandbox.stub(router, "settingsGetByName", function() {
			return function(req, res, next) {
				should.exist(req.params.name);
				req.params.name.should.equals('general');
				next();
			};
		});

		router.settingsSaveByName()(req, res, function() {
			req.errors.exist().should.equals(false);
			done();
		});

	});

	it('should be possible to save template settings by name', function(done) {

		var req = {
				params: {
					name: 'template',
				}
			}

		errors(req, null, function() {});

		sandbox.stub(router, "settingsSaveTemplate", function() {
			return function(req, res, next) {
				should.exist(req.params.name);
				req.params.name.should.equals('template');
				next();
			};
		});

		router.settingsSaveByName()(req, null, function() {
			req.errors.exist().should.equals(false);
			done();
		});

	});

	it('should provide feedback when trying to save settings when settings are finalised', function(done) {

		var req = {
				params: {
					name: 'general',
					settings: {}
				}
			},
			res = {
				render: function() {}
			},
			response = {
				activeTab: req.params.name
			}

		errors(req, null, function() {});

		sandbox.stub(youtransfer.settings, 'push', function (value, callback) {
			should.exist(value);
			value.should.equals(req.params.settings);
			callback(new Error('SETTINGS_FINALISED'));
		});

		sandbox.stub(router, "settingsGetByName", function() {
			return function(req, res, next) {
				should.exist(req.params.name);
				req.params.name.should.equals('general');
				next();
			};
		});

		router.settingsSaveByName()(req, res, function() {
			req.errors.exist().should.equals(true);
			var err = req.errors.get();
			err.length.should.equals(1);
			err[0].message.should.equals("The settings are currently locked. Please unlock them prior to making changes.");
			done();
		})
	});	

	// -------------------------------------------------------------------------------------- Testing settingsSaveByName

	it('should be possible to serve static files', function() {

		var res = {},
			req = {
				params: new Array('some', 'static', 'file')
			},
			server = {
				serveFile: function() {}
			},
			instance = new routes({
				fileServer: server
			});

		var serverMock = sandbox.mock(server);
		serverMock.expects('serveFile').once().withArgs('/' + req.params[1] + '/' + req.params[2], 200, { server: 'youtransfer.io', 'Cache-Control': 'max-age=' + nconf.get('CACHE_MAX_AGE') }, req, res);

		instance.staticFiles()(req, res);
		serverMock.verify();
	});

	// -------------------------------------------------------------------------------------- Testing signout

	it('should be possible to sign out', function() {

		var req = {
				logout: function() {}
			},
			res = {
				redirect: function() {}
			}

		var reqMock = sandbox.mock(req);
		reqMock.expects('logout').once();

		var resMock = sandbox.mock(res);
		resMock.expects('redirect').once();

		router.signout()(req, res);
		reqMock.verify();
		resMock.verify();
		
	});

	// -------------------------------------------------------------------------------------- Testing default routes

	it('should be possible to retrieve a page', function(done) {

		var res = {
				setHeader: function() {},
				process: function() {}
			},
			req = {
				params: new Array('index')
			};

		errors(req, null, function() {});

		var resMock = sandbox.mock(res);
		resMock.expects('setHeader').once().withArgs('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		resMock.expects('process').once().withArgs('index.html', null).callsArg(2);

		router.default()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();
		});
	});

	it('should be possible to retrieve index page if no specific page was requested', function(done) {

		var res = {
				setHeader: function() {},
				process: function() {}
			},
			req = {
				params: {}
			}

		errors(req, null, function() {});

		var resMock = sandbox.mock(res);
		resMock.expects('setHeader').once().withArgs('Cache-Control', 'private, max-age=0, proxy-revalidate, no-store, no-cache, must-revalidate');
		resMock.expects('process').once().withArgs('index.html', null).callsArg(2);

		router.default()(req, res, function() {
			req.errors.exist().should.equals(false);
			resMock.verify();
			done();			
		});
	});	

});
