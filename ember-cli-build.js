/*jshint node:true*/
/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    cssModules: {
      inputFiles: ['ember-css-example/styles/included/**/*.css', 'ember-css-example/components/**/*.css'],
      outputFile: '/assets/css-modules.css'
    },
    cssPipeline: {
      outputFile: '/assets/css-next.css',
      concat: {
        // these are bundled seperately
        include: ['/assets/css-modules.css', '/assets/css-next.css'],
        outputFile: '/assets/bundle.css'
      }
    }
  });

  return app.toTree();
};
