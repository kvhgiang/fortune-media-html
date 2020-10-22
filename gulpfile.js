const gulp = require('gulp');
const pug = require('gulp-pug');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync');
const cached = require('gulp-cached');
const data = require('gulp-data');
const fs = require('fs');
const path = require('path');
const merge = require('gulp-merge-json');
const del = require('del');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const useref = require('gulp-useref-plus');
const gulpif = require('gulp-if');
const npmdist = require('gulp-npm-dist');

const paths = {
  base : {
    dir:    './'
  },
  
  packageLock:  {
    files:  './package-lock.json'
  },

  node:         {
    dir:    './node_modules'
  },

  tmp : {
    dir:    './.tmp',
    files:  './.tmp/**/*'
  },

  src : {
    base:   {
      dir:    './src',
      files:  './src/**/*'
    },
    data:   {
      dir:    './src/data',
      files:  './src/data/*.json',
    },
    pug:   {
      dir:    './src/pugs',
      files:  './src/pugs/**/*.pug',
      main:   './src/pugs/*.pug'
    },
    img:    {
      dir:    './src/assets/img',
      files:  './src/assets/img/**/*',
    },
    less:   {
      dir:    './src/assets/less',
      files:  './src/assets/less/**/*',
      main:   './src/assets/less/*.less'
    },
    css:    {
      dir:    './src/assets/css',
      files:  './src/assets/css/**/*'
    },
    js:     {
      dir:    './src/assets/js',
      files:  './src/assets/js/**/*'
    }
  },

  dist : {
    base:   {
      dir:    './dist'
    },
    libs:   {
      dir:    './dist/assets/libs'
    }
  }
}


//
// Tasks ===================================
//

// ---------- browsersync
gulp.task('browsersync', function(callback) {
  browsersync.init({
    server: {
      baseDir: [paths.tmp.dir, paths.src.base.dir, paths.base.dir]
    },
  });
  callback();
});

gulp.task('browsersyncReload', function(callback) {
  browsersync.reload();
  callback();
});

// ---------- watch
gulp.task('watch', function() {
  gulp.watch(paths.src.less.files, gulp.series('less'));
  gulp.watch([paths.src.js.files, paths.src.img.files], gulp.series('browsersyncReload'));
  gulp.watch([paths.src.pug.files], gulp.series('pug', 'browsersyncReload'));
  gulp.watch([paths.src.data.files], gulp.series('pug:data', 'pug', 'browsersyncReload'));
});


// ---------- clean
gulp.task('clean:tmp', function(callback) {
  del.sync(paths.tmp.dir);
  callback();
});

gulp.task('clean:packageLock', function(callback) {
  del.sync(paths.packageLock.files);
  callback();
});

gulp.task('clean:dist', function(callback) {
  del.sync(paths.dist.base.dir);
  callback();
});


// ---------- copy
gulp.task('copy:all', function() {
  return gulp
    .src([
      paths.src.base.files,      
      '!' + paths.src.less.dir, '!' + paths.src.less.files,
      '!' + paths.src.data.dir, '!' + paths.src.data.files,
      '!'+paths.src.pug.dir, '!'+paths.src.pug.main, '!' + paths.src.pug.files
    ])
    .pipe(gulp.dest(paths.dist.base.dir));
});


gulp.task('copy:libs', function() {
  return gulp
    .src(npmdist(), { base: paths.node.dir })
    .pipe(gulp.dest(paths.dist.libs.dir));
});


// ---------- build css
gulp.task('less', function() {
  return gulp
    .src(paths.src.less.main)
    .pipe(less())
    .pipe(autoprefixer({
      browsers: ['> 1%']
    }))
    .pipe(gulp.dest(paths.src.css.dir))
    .pipe(browsersync.stream());
});


// ---------- build html
gulp.task('pug:data', function() {
  return gulp
    .src(paths.src.data.files)
    .pipe(merge({
      fileName: 'data.json',
      edit: (json, file) => {
        // Extract the filename and strip the extension
        var filename = path.basename(file.path),
            primaryKey = filename.replace(path.extname(filename), '');
        // Set the filename as the primary key for our JSON data
        var data = {};
        data[primaryKey.toUpperCase()] = json;
        return data;
      }
    }))
    .pipe(gulp.dest(paths.tmp.dir));
});

gulp.task('pug', function() {
  return gulp
    .src(paths.src.pug.main)
		.pipe(data(function() {
      return JSON.parse(fs.readFileSync(paths.tmp.dir + '/data.json'))
    }))
		.pipe(pug({
			'pretty' : true
    }))
    .pipe(gulp.dest(paths.tmp.dir));
});

gulp.task('html', function() {
  return gulp
    .src(paths.src.pug.files)
    .pipe(data(function() {
      return JSON.parse(fs.readFileSync(paths.tmp.dir + '/data.json'))
    }))
    .pipe(pug({
      'pretty' : true
    }))
    // .pipe(fileinclude({
    //   prefix: '@@',
    //   basepath: '@file',
    //   indent: true,
    //   context: config
    // }))
    .pipe(replace(/href="(.{0,10})node_modules/g, 'href="$1assets/libs'))
    .pipe(replace(/src="(.{0,10})node_modules/g, 'src="$1assets/libs'))
    .pipe(useref({ searchPath: 'src' }))
    .pipe(cached())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', cssnano({svgo: false})))
    .pipe(gulp.dest(paths.dist.base.dir));
});


gulp.task('build', gulp.series(gulp.parallel('clean:tmp', 'clean:packageLock', 'clean:dist', 'copy:all', 'copy:libs'), 'less', 'pug:data', 'html'));

gulp.task('default', gulp.series('pug:data', gulp.parallel('pug', 'less'), gulp.parallel('browsersync', 'watch')));