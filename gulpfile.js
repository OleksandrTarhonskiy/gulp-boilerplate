const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const del = require('del');
const imagecomp = require('compress-images');

const IMG_INPUT_PATH = 'app/images/src/**/*';
const IMG_OUTPUT_PATH = 'app/images/dest/';

function browsersync() {
  browserSync.init({
    server: { baseDir: './app' },
    notify: false,
    online: true
  })
}

function compileCode() {
  return src('app/*.html')
    .pipe(browserSync.stream());
}

function compileSass() {
  return src('./app/scss/main.scss')
    .pipe(sass({ includePaths: require('node-normalize-scss').includePaths }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(concat('main.min.css'))
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(dest('./app/styles'))
    .pipe(browserSync.stream());
}

function scripts() {
  return src('./app/js/main.js')
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('./app/js/'))
    .pipe(browserSync.stream());
}

function startWatch() {
  watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
  watch('app/scss/**/*.scss', compileSass);
  watch('app/images/src/**/*', images);
  watch('app/*.html', compileCode).on('change', browserSync.reload);
}

async function images() {
  imagecomp(
    IMG_INPUT_PATH,
    IMG_OUTPUT_PATH,
    { compress_force: false, statistic: true, autoupdate: true }, false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "75"] } },
    { png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
    function (error, completed, statistic) {
      console.log("-------------");
      console.log(error);
      console.log(completed);
      console.log(statistic);
      console.log("-------------");
    }
  )
}

function cleanImg() {
  return del('app/images/dest/**/*', { force: true }) // Удаляем все содержимое папки "app/images/dest/"
}

function cleanUp() {
  return del('dist/**/*', { force: true });
}

function buildProduction() {
  return src([
    'app/css/**/*.min.css',
    'app/js/**/*.min.js',
    'app/images/dest/**/*',
    'app/**/*.html',
    ], { base: 'app' })
  .pipe(dest('dist'))
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.compileSass = compileSass;
exports.compileCode = compileCode;
exports.cleanimg = cleanImg;
exports.images = images;
exports.build = series(cleanUp, compileSass, scripts, images, buildProduction);
exports.default = parallel(scripts, compileCode, compileSass, browsersync, startWatch);