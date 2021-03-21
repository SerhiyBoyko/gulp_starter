'use strict'

var fs                 = require('fs') ;

var gulp               = require('gulp'),
	gutil              = require('gulp-util'),
	plumber            = require('gulp-plumber'),
	clean              = require('gulp-clean'),
	uglify             = require('gulp-uglify'),
	concat             = require('gulp-concat'),
	rename             = require('gulp-rename'),
	rimraf             = require('rimraf'),
	gulp_rimraf        = require('gulp-rimraf'),
	cache              = require('gulp-cached'),
	injectSvg 		   = require('gulp-inject-svg'),
	injectSvgOptions   = { base: '/src/' },
	sourcemaps 		   = require('gulp-sourcemaps')
;


var postcss            = require('gulp-postcss'),
	rucksack 		   = require('rucksack-css'),
	pixrem             = require("pixrem"),
	partial_import     = require('postcss-partial-import'),
	mixins             = require('postcss-sassy-mixins'),
	mediaMinMax        = require('postcss-media-minmax'),
	nested             = require('postcss-nested'),
	atRoot             = require('postcss-atroot'),
	extend             = require('postcss-extend'),
	assets             = require('postcss-assets'),
	scss               = require('postcss-scss'),
	math               = require('postcss-automath'),
	mqpacked           = require('css-mqpacker'),
	hexrgba            = require('postcss-hexrgba'),
	cssnano            = require('gulp-cssnano'),
	inlineCss          = require('gulp-inline-css'),
	postcssRandom      = require('postcss-random'),
	properties         = require('postcss-define-property'),
	postcss_click      = require('postcss-click')

;

var pug                = require('gulp-pug'),
	htmlHint           = require('gulp-htmlhint')
;

var imagemin           = require('gulp-imagemin'),
	pngquant           = require('imagemin-pngquant'),
	svgmin       = require('gulp-svgmin'),
	cheerio       = require('gulp-cheerio'),
	replace       = require('gulp-replace'),
	svgSprite       = require('gulp-svg-sprite'),
	postcssInlineSvg = require('postcss-inline-svg'),
	iconfontCss        = require('gulp-iconfont-css')
;




var watch              = require('gulp-watch'),
	browserSync        = require('browser-sync').create(),
	reload             = browserSync.reload,
	del                = require('del'),
	batch              = require('gulp-batch')
;



//ERROR
function errorHandler(error){
	gutil.log([
		gutil.colors.red.bold(error.name + ' in ' + error.plugin),
		'',
		error.message,
		''
	].join('\n'));

	this.emit('end');
}


//Pug
gulp.task('pug', function(){
	var prettify = require('gulp-prettify');

	return gulp.src('src/pug/**/!(_)*.pug') //компілюєм всі файлм, за винятком якщо вони починаються з _ (так ми будем називати файли які підключаєм)
		.pipe(plumber({errorHandler: errorHandler}))
		.pipe(cache('html'))
		.pipe(pug())
		.pipe(prettify({
			'indent_inner_html': false,
			'indent_size': 1,
			'indent_char': "\t",
			'wrap_line_length': 78,
			'brace_style': 'expand',
			'unformatted': ['sub', 'sup', 'b', 'i', 'u', 'textarea'],
			'preserve_newlines': true,
			'max_preserve_newlines': 5,
			'indent_handlebars': false,
			'extra_liners': []
		}))
		.pipe(injectSvg(injectSvgOptions))
		.pipe(gulp.dest('dist/'))
		.on('end', reload);
});


//POST-CSS
gulp.task('css', function (done){

	/*var grid_variables = {},
		grid = 100;

	for(var i = 1; i<13; i++){
		grid_variables['grid_'+i] = grid*i;

		grid_variables['grid_'+i] += "px";
	}*/

	//console.log(grid_variables);

	var variables = require('postcss-advanced-variables')/*({variables:grid_variables})*/;

	/*var functions = require('postcss-functions')({
		functions: {
			/!*'letter-spacing': function (value) {
				return (value / 1000) + 'em';
			},
			'un': function (value) {
				return (value / 900) * 100 + 'vh';
			},
			'adaptive': function (width, height) {
				return (height / width) * 100 + '%';
			},*!/
			/!*
			'bg-img': function (url){

				for(var i = 1; i < 11; i++){
					return (url)
				}
			}*!/
		}
	});*/

	var processors = [
		/*short,          // https://github.com/jonathantneal/postcss-short*/
		partial_import,
		properties({
			syntax: {
				atrule: true,
				parameter: '',
				property: '+',
				separator: ''
			}
		}),
		mixins,         // https://github.com/postcss/postcss-mixins
		assets,         // https://github.com/assetsjs/postcss-assets
		variables,      // https://github.com/jonathantneal/postcss-advanced-variables
		mediaMinMax,    // https://github.com/postcss/postcss-media-minmax
		nested,
		atRoot,         // https://github.com/OEvgeny/postcss-atroot
		extend,         // https://github.com/travco/postcss-extend
		/*functions,*/
		postcss_click({
			output: 'src/js/click.js',
			append: false
		}),
		hexrgba,
		mqpacked,
		postcssRandom,
		math,
		rucksack
	];

	return gulp.src('src/css/style.pcss')
		.pipe(plumber({errorHandler: errorHandler}))
		.pipe(postcss(processors, {parser:scss}))
		.pipe(cssnano({
			autoprefixer: {
				add: true,
				remove: false,
				browsers: ['> 1%', 'ie >= 9', 'not ie <= 8', 'chrome > 1', 'Opera >= 11', 'firefox >= 3', 'safari > 4', 'last 3 version']
			},
			calc: false,
			normalizeUrl: false,
			mergeLonghand: false,
			convertValues: {
				length: false
			},
			normalizeCharset: {
				add: true
			},
			discardUnused: false,
			reduceIdents: false,
			mergeIdents: false,
			zindex: false,
			discardComments: {removeAll: true}
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(rename('style.css'))
		.pipe(gulp.dest('dist/css/'))
		.pipe(reload({stream:true}));
});


// JavaScript
gulp.task('scripts', function () {
	return gulp.src([
		'src/js/swiper-bundle.min.js', // Swiper slider
		'src/js/script.js',
	])
		.pipe(plumber({errorHandler: errorHandler}))
		.pipe(concat('script.min.js'))
		// .pipe(uglify())
		.pipe(gulp.dest('dist/js/'))
		.on('end', reload);
});


// Copy generated fonts
gulp.task('copy_fonts', function(){
	return gulp.src('src/generated-fonts/*.{eot,ttf,woff,woff2,svg}')
		.pipe(gulp.dest('dist/fonts/'));
});


// IMG
gulp.task('img', function() {
	return gulp.src(["src/images/**/*.{jpg,gif,svg,png}","!src/images/**/_*.*"])
		.pipe(plumber({errorHandler: errorHandler}))
		.pipe(imagemin([

			imagemin.gifsicle({interlaced: true}),
			imagemin.optipng({optimizationLevel: 5}),
		]))
		.pipe(gulp.dest('dist/images'));
});


/** SVG ICONS  SPRITES **/

gulp.task('sprite:svg', function () {
	return gulp.src(["src/sprite-svg/*.svg","!src/sprite-svg/_*.svg"])
		/*.pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))*/
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[stroke]').removeAttr('stroke');
				$('[style]').removeAttr('style');
			},
			parserOptions: {xmlMode: true}
		}))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite({
			shape:{
				transform:[]
			},
			mode: {
				symbol: {
					sprite: "../images/sprite.svg",
					render: {
						pcss: {
							dest:"../css/_sprite-svg.pcss",
							template: "src/sprite-svg/template.pcss"
						}
					}
				}
			}
		}))
		.pipe(gulp.dest('src/'));
});





// COPY SVG
gulp.task('copy_svg', function() {
	return gulp.src(['src/images/**/*.svg', '!src/images/icons/font/*.svg'])
		.pipe(gulp.dest('dist/images'));
});


// COPY root files
gulp.task('copy_root_files', function() {
	return gulp.src(['src/root_files/**/*'])
		.pipe(gulp.dest('dist'));
});


// CLEAN Folders
gulp.task('clean', function (cb) {
	rimraf("dist", cb);
});

// CLEAN html CACHE
gulp.task('clear_html_cache', function(done){
	var cache = require('gulp-cached');

	delete cache.caches['html'];
	done();
});

// Build
gulp.task('build', gulp.parallel(
	'pug',
	'css',
	'img',
	'copy_svg',
	'copy_root_files',
	'scripts',
	'copy_fonts'
	)
);

gulp.task('rebuild', gulp.series('clean', 'clear_html_cache', 'build'));


//Server
gulp.task('server', function(done){
	browserSync.init({
		server: {
			baseDir: "dist"
		},
		open: false
	});

	done();
});

//watch
gulp.task('watch', function(done) {
	gulp.watch('src/pug/**/_*.pug', gulp.series('clear_html_cache','pug'));
	gulp.watch('src/pug/**/!(_)*.pug', gulp.series('pug'));
	gulp.watch('src/css/**/*', gulp.series('css'));
	gulp.watch('src/js/**/*', gulp.series('scripts'));
	gulp.watch(['src/images/**/*.*'], gulp.series('img'));
	gulp.watch(['src/images/**/*.svg', '!src/images/icons/font/*.svg'], gulp.series('copy_svg'));
	gulp.watch("src/sprite-svg/*.*", gulp.series('sprite:svg'));


	done();
});


//default
gulp.task('default', gulp.series('watch', 'server'));
