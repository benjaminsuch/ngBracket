var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var del = require('del');
var open = require('gulp-open');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var docs = require('gulp-ngdocs');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var inject = require('gulp-inject');
var angularFilesort = require('gulp-angular-filesort');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var server = require('gulp-server-livereload');
var messenger = require('gulp-messenger');
var templateCache = require('gulp-angular-templatecache');
var htmlmin = require('gulp-htmlmin');
var package = require('./package.json');

var CONFIG = {
  vendor: {
    js: [
      'vendor/angular/angular.js'
    ],
    css: [

    ]
  }
};

gulp.task('build:scripts', function() {
  return gulp.src('./src/**/*.js')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:static', function() {
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:templates', function() {
  return gulp.src('./src/**/*.tpl.html')
    .pipe(templateCache({
      standalone: true,
      moduleSystem: 'IIFE'
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task('build:less', function() {
  return gulp.src('./src/less/import.less')
    .pipe(less({
      compress: true
    }))
    .pipe(rename({
      basename: package.name,
      suffix: '.min'
    }))
    .pipe(gulp.dest('./build/assets'));
});

gulp.task('build:assets', function() {
  return gulp.src('./src/assets/**/*')
    .pipe(gulp.dest('./build'));
});

gulp.task('build:index', function() {
  return gulp.src('./src/index.html')
    .pipe(inject(
      gulp.src('./build/assets/*.min.css', {read: false}),
      {
        addRootSlash: false,
        ignorePath: 'build'
      }
    ))
    .pipe(inject(
      gulp.src(CONFIG.vendor.js, {read: false}),
      {
        relative: true,
        addRootSlash: false,
        starttag: '<!-- inject:vendor -->'
      }
    ))
    .pipe(inject(
      gulp.src(['./build/**/*.js', '!./build/vendor/**/*'])
        .pipe(angularFilesort()),
      {
        addRootSlash: false,
        ignorePath: 'build'
      }
    ))
    .pipe(gulp.dest('./build'));
});

gulp.task('build:vendor', function() {
  return gulp.src(CONFIG.vendor.js, {base: '.'})
    .pipe(gulp.dest('./build'));
});

gulp.task('build:docs', function() {
  return gulp.src(['./build/**/*.js', '!./build/vendor/**/*.js'])
    .pipe(docs.process())
    .pipe(gulp.dest('./docs'));
});

gulp.task('lint:src', function() {
  return gulp.src('./src/**/*.js')
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('clean:build', function() {
  del.sync(['./build']);
});

gulp.task('clean:dist', function() {
  del.sync(['./dist']);
});

gulp.task('listen', function() {
  gulp.src('./build')
    .pipe(server({
      livereload: true,
      open: true
    }));

  function unlink(file, dir) {
    dir = dir ? dir : 'app';
    file = path.resolve('./build' + dir, path.relative(path.resolve('src' + dir), file));
    
    return del(file, {force: true}).then(function(paths) {
      messenger.info('\nDeleted:\t' + paths.join('\n') + '\n');
    });
  }


  watch('./src/index.html', function() {
    gulp.start(['build:index']);
  });

  watch('./src/**/*.tpl.html', function() {
    gulp.start(['build:templates']);
  }).on('unlink', function(file) {
    unlink(file);
  });

  watch('./src/**/*.js', function() {
    gulp.start(['lint:src', 'build:scripts', 'build:index']);
  }).on('unlink', function(file) {
    unlink(file);
  });

  watch('./src/**/*.less', function() {
    gulp.start(['build:less', 'build:index']);
  }).on('unlink', function(file) {
    unlink(file);
  });

  watch('./src/assets/**/*', function() {
    gulp.start(['build:assets']);
  }).on('unlink', function(file) {
    unlink(file, 'assets');
  });
});

gulp.task('listen:docs', function() {
  gulp.src('./docs')
    .pipe(server({
      port: 8001,
      livereload: {
        enable: true,
        port: 35730
      },
      open: true
    }));
});

gulp.task('compile:scripts', function() {
  return gulp.src(['./build/**/*.js', '!./build/vendor/**/*.js'])
    .pipe(concat(package.name + '.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/assets'));
});

gulp.task('compile:assets', function() {
  return gulp.src('./build/assets/**/*')
    .pipe(gulp.dest('./dist/assets'));
});

gulp.task('compile:index', function() {
  return gulp.src('./src/index.html')
    .pipe(inject(
      gulp.src('./build/assets/*.min.css'),
      {
        addRootSlash: false,
        ignorePath: 'build'
      }
    ))
    .pipe(inject(
      gulp.src('./dist/assets/' + package.name + '.min.js'),
      {
        addRootSlash: false,
        ignorePath: 'dist'
      }
    ))
    .pipe(gulp.dest('./dist'));
});

gulp.task('build', function(cb) {
  runSequence(
    'lint:src',
    'clean:build',
    [
      'build:scripts',
      'build:static',
      'build:templates',
      'build:less',
      'build:assets',
      'build:vendor'
    ],
    'build:docs',
    'build:index',
    cb
  );
});

gulp.task('compile', function(cb) {
  runSequence(
    'clean:dist',
    [
      'compile:scripts',
      'compile:assets'
    ],
    'compile:index',
    cb
  );
});

gulp.task('default', [
  'build'
]);

gulp.task('watch', function(cb) {
  runSequence(
    'default',
    'listen',
    cb
  );
});

gulp.task('dist', function(cb) {
  runSequence(
    'build',
    'compile',
    cb
  );
});