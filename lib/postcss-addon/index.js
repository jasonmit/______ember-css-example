/*jshint node:true*/

var funnel = require('broccoli-funnel');
var concat = require('broccoli-concat');
var mergeTrees = require('broccoli-merge-trees');
var compileCSS = require('broccoli-postcss-sourcemaps');
var simpleVars = require('postcss-simple-vars');

var ModulesPreprocessor = require('ember-css-modules/lib/modules-preprocessor');

// Shim: we already provide the app styles into the JS
ModulesPreprocessor.prototype.inputTreeWithStyles = function(inputTree) {
  return inputTree;
};

function PostCSSPlugin(owner, type, options) {
  this.owner = owner;
  this.type = type;
  this.ext = 'css';
  this.options = options || {};
}

PostCSSPlugin.prototype.constructor = PostCSSPlugin;

PostCSSPlugin.prototype.toTree = function(inputNode, inputPath, outputDirectory, options) {
  if (this.type === 'js') {
    var appStyles = funnel(this.owner.app.trees.styles, {
      destDir: this.owner.app.name + '/styles'
    });

    inputNode = mergeTrees([inputNode, appStyles], { overwrite: true });
  }

  var styleTree = compileCSS(funnel(inputNode, { include: ['**/*.css' ]}), {
    plugins: [{
      module: simpleVars,
      options: {
        variables: {
          large: '1.2em',
          red: 'red',
          gray: '#334',
          white: '#fff'
        }
      }
    }]
  });

  if (this.type === 'css') {
    // bundle all app styles that are not modules
    var bundledStyles = concat(funnel(styleTree, {
      // would be provided by the css-modules config
      exclude: this.options.concat && this.options.concat.exclude || []
    }), {
      outputFile: this.options.outputFile || options.outputPaths.app
    });

    inputNode = mergeTrees([inputNode, bundledStyles]);
  }

  return mergeTrees([inputNode, styleTree], { overwrite: true });
};

module.exports = {
  name: 'postcss-addon',

  isDevelopingAddon: function() {
    return true;
  },

  setupPreprocessorRegistry: function(type, registry) {
    // Skip if we're setting up this addon's own registry
    if (type !== 'parent') { return; }

    var options = registry.app.options && registry.app.options.cssPipeline || {};

    registry.add('js', new PostCSSPlugin(this, 'js', options));
    registry.add('css', new PostCSSPlugin(this, 'css', options));
  },

  postprocessTree: function(type, tree) {
    if (type === 'css') {
      var options = this.app.options.cssPipeline.concat;

      // clean up files that find there way through to the dist
      // this is because ember-cli automatically adds the files to
      // /dist if a preprocessor did not concat
      tree = funnel(tree, { exclude: ['app/**/*.css'] });

      tree = concat(tree, {
        inputFiles: options.include,
        outputFile: options.outputFile
      });
    }

    return tree;
  }
};
