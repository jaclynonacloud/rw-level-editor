// use module approach to require gulp and other dev dependencies
// gulp is a toolkit that will help you automate time consuming tasks in your workflow
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var sass = require('gulp-sass');
var babel = require('babelify');
var concat = require('gulp-concat');
var merge = require('merge-stream');

// for transpiling ES2015 to ES5 via Babel
gulp.task('build', function(){

// ./src/app.js is the entry point in your project folder (change it to as required)
var bundler = browserify('./src/main.js', { debug: true }).transform(babel);

bundler.bundle()
    .on('error', function(err) { console.error(err); this.emit('end'); })
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    // where transpiled JS is output
    .pipe(gulp.dest('./js'));

    console.log(">>> I am busy transpiling JS :)");
});

// for transpiling Sass to CSS
gulp.task('sass', function() {
  // transpile all sass files and concatenate together
  var scssStream = gulp.src('sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(concat('scss-files.scss'))
  ;
  // concatenate all css together
  var cssStream = gulp.src(['sass/**/*.css','lib/**/*.css'])
      .pipe(concat('css-files.css'))
  ;
  // merge them all together
  merge(scssStream, cssStream)
      .pipe(concat('main.css'))
      .pipe(gulp.dest('./css/'));

  console.log(">>> I am busy transpiling and merging CSS :)");
});

gulp.task('watch', function () {
  // watching all JS and Sass files
  gulp.watch('./src/**/*.js', ['build']);
  gulp.watch('./lib/**/*.js', ['build']);
  gulp.watch('sass/**/*.scss',['sass']);
  gulp.watch('sass/**/*.css',['sass']);
});

gulp.task('default', ['watch','build','sass']);