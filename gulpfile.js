'use strict';

// ------------------------------------------------------------------------------------------ Configuration

var paths = {
	src: 'src',
	dist: 'dist',
};

// ------------------------------------------------------------------------------------------ Dependencies

var gulp = require('gulp');
var filter = require('gulp-filter');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var less = require('gulp-less');
var del = require('del');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var vinylPaths = require('vinyl-paths');
var runSequence = require('run-sequence').use(gulp);

// ------------------------------------------------------------------------------------------ Tasks

gulp.task('cleanTask', cleanTask);
gulp.task('browserifyAppTask', browserifyAppTask);
gulp.task('browserifyVendorTask', browserifyVendorTask);
gulp.task('copyStaticTask', copyStaticTask);
gulp.task('lessTask', lessTask);

gulp.task('build', ['browserifyAppTask', 'browserifyVendorTask', 'copyStaticTask', 'lessTask']);
gulp.task('dist', runSequence(['cleanTask', 'build']));

gulp.task('watch', ['dist'], function() {
	gulp.watch(paths.src + '/**/js/**', ['browserifyAppTask', 'browserifyVendorTask']);
	gulp.watch(paths.src + '/**/css/*', ['lessTask']);
	gulp.watch([paths.src + '/*','!**/js/**', '!**/css/**'], ['copyStaticTask']);
});

// ------------------------------------------------------------------------------------------ Task Definitions

function cleanTask() {
	return gulp.src('dist/*', {read: false})
	 		   .pipe(vinylPaths(del));
};

function browserifyAppTask() {
    var bundler = browserify({ entries: paths.src + '/js/index.js' });
    bundler.external(require('./src/js/vendor.js'));

    return bundler.bundle()
				  .pipe(source('app.js'))
				  .pipe(buffer())
				  .pipe(uglify())
				  .pipe(gulp.dest(paths.dist + '/js'));
};

function browserifyVendorTask() {
    var bundler = browserify();
    bundler.require(require('./src/js/vendor.js'));

    return bundler.bundle()
				  .pipe(source('vendor.js'))
				  .pipe(buffer())
				  .pipe(uglify())
				  .pipe(gulp.dest(paths.dist + '/js'));
};

function copyStaticTask() {
	return gulp.src(paths.src + '/*', {base: paths.src})
			   .pipe(filter(['**/*', '!**/js/**', '!**/css/**']))
			   .pipe(gulp.dest(paths.dist));
};

function lessTask() {
	return gulp.src(paths.src + '/css/styles.less')
			   .pipe(less())
			   .pipe(cssmin())
			   .pipe(gulp.dest(paths.dist + '/css'));
};

