module.exports = function(grunt) {

  var fs = require('fs');

  var depPath = 'libs/';
  var dependencies = fs.readdirSync(depPath);
  for (var i = 0; i < dependencies.length; i++) {
    dependencies[i] = depPath + dependencies[i];
  };

  var sourceFile = 'src/X.js';
  var files = dependencies.concat(sourceFile);

  // Project configuration.
  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      build: {
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.js': files
        }
      }, 
      test: {
        files: {
          'test/<%= pkg.name %>.js': files
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.casedName %>.js v<%= pkg.version %> | (c) 2015 <%= pkg.author %> */\n'
      },
      build: {
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['dist/<%= pkg.name %>-<%= pkg.version %>.js']
        }
      }

    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false // Optionally suppress output to standard out (defaults to false)
        },
        src: ['test/tests.js']
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha-test');

  var build_steps = ['concat:build', 'uglify'];
  grunt.registerTask('default', build_steps );
  grunt.registerTask('build', build_steps);
  grunt.registerTask('test', ['concat:test', 'mochaTest']);

};