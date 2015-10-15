'use strict';

// ------------------------------------------------------------------------------------------ Configuration

var paths = {
	src: 'src',
	dist: 'dist',
	bootstrap: 'node_modules/bootstrap/dist'
};

// ------------------------------------------------------------------------------------------ Dependencies

var gulp = require('gulp');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var less = require('gulp-less');
var gutil = require('gulp-util');
var karma = require('gulp-karma');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var webdriver = require('gulp-webdriver');
var del = require('del');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var vinylPaths = require('vinyl-paths');
var selenium = require('selenium-standalone');
var runSequence = require('run-sequence');

// ------------------------------------------------------------------------------------------ Tasks

gulp.task('cleanTask', cleanTask);
gulp.task('browserifyAppTask', browserifyAppTask);
gulp.task('browserifyVendorTask', browserifyVendorTask);
gulp.task('copyStaticTask', copyStaticTask);
gulp.task('lessTask', lessTask);
gulp.task('testComponentsTask', testComponentsTask);
gulp.task('testModulesTask', testModulesTask);
gulp.task('testViewsTask', ['testWebdriverTask'], testViewsTask);
gulp.task('testWebdriverTask', ['build'], testWebdriverTask);
gulp.task('testTerminationTask', testTerminationTask);

gulp.task('clean', ['cleanTask']);
gulp.task('build', ['browserifyAppTask', 'browserifyVendorTask', 'copyStaticTask', 'lessTask']);
gulp.task('dist', ['build']);
gulp.task('test', function(callback) {
	runSequence('testModulesTask', 'testComponentsTask', 'testViewsTask', 'testTerminationTask', callback);
});

gulp.task('watch', ['dist'], function() {
	gulp.watch([paths.src + '/**/js/**', '!**/*.less'], ['browserifyAppTask', 'browserifyVendorTask']);
	gulp.watch(paths.src + '/**/*.less', ['lessTask']);
	gulp.watch([paths.src + '/**/*','!**/js/**', '!**/*.less'], ['copyStaticTask']);
});

// ------------------------------------------------------------------------------------------ Task Definitions

function cleanTask() {
	return gulp.src('dist/*', {read: false})
	 		   .pipe(vinylPaths(del));
}

function browserifyAppTask() {
	var bundler = browserify({ entries: paths.src + '/js/index.js' });
    bundler.external(require('./src/js/vendor.js'));
    return browserifyTask(bundler, 'app.js');
}

function browserifyVendorTask() {
	var bundler = browserify();
    bundler.require(require('./src/js/vendor.js'));
    return browserifyTask(bundler, 'vendor.js');
}

function browserifyTask(bundler, src) {
	return bundler.bundle()
				  .on('error', log)
				  .pipe(source(src))
				  .pipe(buffer())
				  .pipe(uglify())
				  .pipe(gulp.dest(paths.dist + '/js'));
}

function copyStaticTask() {
	gulp.src(paths.bootstrap + '/**/*', {base: paths.bootstrap})
		.pipe(filter(['**/fonts/**']))
		.on('error', log)
		.pipe(gulp.dest(paths.dist));

	return gulp.src(paths.src + '/**/*', {base: paths.src})
			   .pipe(filter(['**/*', '!**/js/**', '!**/css/**']))
			   .on('error', log)
			   .pipe(gulp.dest(paths.dist));
}

function lessTask() {
	return gulp.src(paths.src + '/css/styles.less')
			   .pipe(less())
			   .pipe(cssmin())
			   .on('error', log)
			   .pipe(gulp.dest(paths.dist + '/css'));
}

function testModulesTask() {
	return gulp.src(['./lib/*.js'])
			   .pipe(istanbul({includeUntested: true}))
			   .pipe(istanbul.hookRequire())
			   .on('finish', function () {
					gulp.src(['./test/modules/**/*.test.js'])
						.pipe(mocha({reporter: 'spec'}))
						.pipe(istanbul.writeReports({ 
							dir: './test/unit-test-coverage', 
							reporters: [ 'lcov' ], 
							reportOpts: {
								dir: './test/unit-test-coverage'
							}
						}))
						.on('error', log);
			   })
			   .on('error', log);
}

function testComponentsTask() {
	return gulp.src([])
			   .pipe(karma({ configFile: './test/components/karma.conf.js', action: 'run'}))
			   .on('error', function (err) {
					throw err;
			    });
}

function testViewsTask() {
	return  gulp.src('./test/views/wdio.conf.js')
				.pipe(webdriver())
				.on('error', log)
				.on('finish', function() {
					selenium.app.close();
					selenium.server.kill();
				});
}

function testWebdriverTask(callback) {
	selenium.install({
		baseURL: 'http://selenium-release.storage.googleapis.com',
		drivers: {
			chrome: {
				version: '2.15',
				arch: process.arch,
				baseURL: 'http://chromedriver.storage.googleapis.com'
			}
		}
	}, function(err) {
		if(!err) {
			selenium.start(function(err, child) {
				if(!err) {
					selenium.app = require('./app');
					selenium.server = child;
					callback();
				} else {
					callback(err);
				}
			});
		} else {
			callback(err);
		}
	});	
}

// Workaround for issue with gulp WebdriverIO task not ending the browser session correctly
// This means that the test should be run stand-alone
function testTerminationTask() {
	process.exit(0);
}


// ------------------------------------------------------------------------------------------ Functions

function log(err) {
	gutil.log(gutil.colors.red('Error'), err.message);
}
