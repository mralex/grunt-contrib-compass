/*
 * grunt-contrib-compass
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Sindre Sorhus, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
  var compass = require('./lib/compass').init(grunt);

  function compile(args, options, cb) {
    var child = grunt.util.spawn({
      cmd: args.shift(),
      args: args
    }, function (err, result, code) {
      var success = code === 0;

      if (code === 127) {
        return grunt.warn(
          'You need to have Ruby and Compass installed ' +
          'and in your system PATH for this task to work. ' +
          'More info: https://github.com/gruntjs/grunt-contrib-compass'
        );
      }

      // `compass compile` exits with 1 and outputs "Nothing to compile"
      // on stderr when it has nothing to compile.
      // https://github.com/chriseppstein/compass/issues/993
      // Don't fail the task in this situation.
      if (code === 1) {
        if (/Nothing to compile/g.test(result.stderr)) {
          success = true;
        } else {
          success = false;
        }
      }

      if (code === 0 && options.treatWarningsAsErrors && /WARNING on line/g.test(result.stderr)) {
        success = false;
      }

      cb(success);
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  grunt.registerMultiTask('compass', 'Compile Sass to CSS using Compass', function () {
    var options = this.options();
    var cb = this.async();

    // display compilation time
    if (!options.clean) {
      options.time = true;
    }

    // create a function to retroactively add a banner to the top of the
    // generated files, if specified
    var bannerCallback = compass.buildBannerCallback(grunt, options);
    // create a temporary config file if there are 'raw' options or
    // settings not supported as CLI arguments
    var configContext = compass.buildConfigContext(options);
    // get the array of arguments for the compass command
    var args = compass.buildArgsArray(options);

    configContext(function (err, path) {
      if (err) {
        grunt.fail.warn(err);
      }

      if (path) {
        args.push('--config', path);
      }

      compile(args, options, function (success) {
        bannerCallback();
        cb(success);
      });
    });
  });
};
