const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const rigger = require('gulp-rigger');
const del = require('del');

function browsersync() {
  browserSync.init({
    server: { baseDir: 'app/' },
    notify: false,
    online: true
  })
}

function compileCode() {
  return src('app/*.html')
    .pipe(plumber())
    .pipe(browserSync.stream());
}

function htmlBuild() {
  return src('app/views/*.html')
    .pipe(rigger())
    .pipe(dest('app'))
    .pipe(browserSync.stream());
}

// sass:
function compileSass() {
  return src('app/styles/scss/main.scss')
    .pipe(plumber())
    .pipe(sass({ includePaths: require('node-normalize-scss').includePaths }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(concat('main.min.css'))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(dest('./app/styles'))
    .pipe(browserSync.stream());
}


// bootstrap styles and scripts:
function bootstrap() {
  return src(['node_modules/bootstrap/scss/**', 'src/scss/*.scss'])
    .pipe(dest("app/styles/scss/bootstrap"))
    .pipe(browserSync.stream());
}

function jsBootstrap() {
  return src(['node_modules/bootstrap/dist/js/bootstrap.min.js'])
      .pipe(dest('app/scripts/src/_includes'))
      .pipe(browserSync.stream());
};

// js:
function scripts() {
  return src(['app/scripts/src/_includes/**/*.js', 'app/scripts/src/**/*.js'])
    .pipe(plumber())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(dest('./app/scripts'));
}

// looking for changes:
function startWatch() {
  watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
  watch('app/styles/scss/**/*.scss', compileSass).on('change', browserSync.reload);
  watch('app/images/**/*', images);
  watch('app/views/layouts/*.html', htmlBuild).on('change', browserSync.reload);
  watch('app/views/*.html', htmlBuild).on('change', browserSync.reload);
  watch('app/*.html', compileCode).on('change', browserSync.reload);
}

//images:
async function images() {
  src(['app/images/*.jpg', 'app/images/*.png'])
    .pipe(plumber())
    .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
    .pipe(dest('app/images'));
}

function cleanUp() {
  return del('dist/**/*', { force: true });
}

function buildProduction() {
  return src([
    'app/styles/**/*.min.css',
    'app/scripts/*.min.js',
    'app/images/**/*',
    'app/*.html',
    ], { base: 'app' })
  .pipe(dest('dist'));
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.compileSass = compileSass;
exports.htmlBuild = htmlBuild;
exports.compileCode = compileCode;
exports.images = images;
exports.build = series(cleanUp, jsBootstrap, scripts, compileCode, htmlBuild, bootstrap, compileSass, images, buildProduction);
exports.default = parallel(jsBootstrap, scripts, compileCode, htmlBuild, bootstrap, compileSass, browsersync, startWatch);
