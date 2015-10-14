(function() {

  var gulp = require('gulp'),
    connect = require('gulp-connect'),
    open = require('gulp-open'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    path = require('path'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    sass = require('gulp-sass'),
    minifyCSS = require('gulp-minify-css'),
    tap = require('gulp-tap'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    fs = require('fs'),
    template = require('gulp-template'),
    qunit = require('gulp-qunit'),
    argv = require('minimist')(process.argv.slice(2));

  var buildConfig = require('./config/build.config.js');
  var pkg = require('./package.json');

  function customFileStream(file, t) {
    var addIndent = '  ';
    var filename = file.path.split('src/scripts/')[1];

    if (filename === 'Mob.prefix' || filename === 'Mob.suffix') {
      addIndent = '';
    }

    if (addIndent !== '') {
      var fileLines = fs.readFileSync(file.path).toString().split('\n');
      var newFileContents = '';
      for (var i = 0; i < fileLines.length; i++) {
        var fileLine = fileLines[i];

        fileLine = fileLine.replace('$VERSION', pkg.version);

        newFileContents += addIndent + fileLine + (i === fileLines.length ? '' : '\n');
      }
      file.contents = new Buffer(newFileContents);
    }
  }

  gulp.task('styles', function(done) {
    gulp.src('src/styles/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(sass({
        onError: function(err) {
          done(err);
        }
      }))
      .pipe(concat(buildConfig.filename + '.css'))
      .pipe(gulp.dest(buildConfig.paths.build.styles))
      .pipe(minifyCSS())
      .pipe(rename({
        extname: '.min.css'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildConfig.paths.build.styles))
      .on('end', done);
  });

  /* ==================================================================
   * Build Mob
   * ================================================================== */

  gulp.task('scripts', function(cb) {

    gulp.src(buildConfig.files.scripts)
      .pipe(tap(function(file, t) {
        customFileStream(file, t);
      }))
      .pipe(sourcemaps.init())
      .pipe(concat(buildConfig.filename + '.js'))
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(jshint())
      .pipe(jshint.reporter(stylish))
      .pipe(gulp.dest(buildConfig.paths.build.scripts))
      .pipe(uglify())
      .pipe(header(buildConfig.banner, {
        pkg: pkg,
        date: buildConfig.date
      }))
      .pipe(rename({
        extname: '.min.js'
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(buildConfig.paths.build.scripts))
      .pipe(connect.reload())
      .on('end', function() {
        cb();
      });
  });

  gulp.task('test-node', function() {
    return gulp.src('test/test-runner.html')
      .pipe(qunit());
  });

})();