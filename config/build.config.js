module.exports = {

  filename: 'mob',

  banner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %>',
    ' * <%= pkg.description %>',
    ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The XScripter.com',
    ' * http://www.xscripter.com/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''
  ].join('\n'),

  customBanner: [
    '/**',
    ' * <%= pkg.name %> <%= pkg.version %> - Custom Build',
    ' * <%= pkg.description %>',
    ' * ',
    ' * Included modules: <%= modulesList %>',
    ' * ',
    ' * <%= pkg.homepage %>',
    ' * ',
    ' * Copyright <%= date.year %>, <%= pkg.author %>',
    ' * The XScripter.com',
    ' * http://www.xscripter.com/',
    ' * ',
    ' * Licensed under <%= pkg.license.join(" & ") %>',
    ' * ',
    ' * Released on: <%= date.month %> <%= date.day %>, <%= date.year %>',
    ' */',
    ''
  ].join('\n'),

  date: {
    year: new Date().getFullYear(),
    month: ('January February March April May June July August September October November December').split(' ')[new Date().getMonth()],
    day: new Date().getDate()
  },

  paths: {
    root: './',
    build: {
      root: 'build/',
      styles: 'build/css/',
      scripts: 'build/js/'
    },
    custom: {
      root: 'custom/',
      styles: 'custom/css/',
      scripts: 'custom/js/'
    },
    dist: {
      root: 'dist/',
      styles: 'dist/css/',
      scripts: 'dist/js/'
    },
    source: {
      root: 'src/',
      styles: 'src/styles/',
      scripts: 'src/scripts/*.js'
    }
  },

  files: {
    'scripts': [
      'src/scripts/Mob.prefix',
      'src/scripts/Mob.js',

      // seed
      'src/scripts/seed/module.js',
      'src/scripts/seed/lang.js',
      'src/scripts/seed/logger.js',
      'src/scripts/seed/jqlite.js',

      // core
      'src/scripts/core/base.js',
      'src/scripts/core/class.js',
      'src/scripts/core/events.js',
      'src/scripts/core/http.js',
      'src/scripts/core/storage.js',
      'src/scripts/core/support.js',
      'src/scripts/core/view.js',

      // features
      'src/scripts/features/platform.js',
      'src/scripts/features/touch.js',
      'src/scripts/features/scroller.js',
      'src/scripts/features/pullToRefresh.js',
      'src/scripts/features/transition.js',
      'src/scripts/features/viewport.js',

      // addons
      'src/scripts/addons/swipe.js',

      // skeleton
      'src/scripts/skeleton/template.js',
      'src/scripts/skeleton/component.js',
      'src/scripts/skeleton/screen.js',
      'src/scripts/skeleton/screenComponent.js',
      'src/scripts/skeleton/screenManager.js',
      'src/scripts/skeleton/screenView.js',
      'src/scripts/skeleton/router.js',
      'src/scripts/skeleton/application.js',

      'src/scripts/Mob.suffix'
    ],
    'styles': []
  }

};