/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = (config) => {
  config.set(
    merge(createDefaultConfig(config), {
      files: [
        // runs all files ending with .test in the test folder,
        // can be overwritten by passing a --grep flag. examples:
        //
        // npm run test -- --grep test/foo/bar.test.js
        // npm run test -- --grep test/bar/*
        {
          pattern: config.grep ? config.grep : 'test/**/*.test.js',
          type: 'module'
        },
        {
          pattern: require.resolve('cryptojslib/components/core.js'),
          type: 'js'
        },
        {
          pattern: require.resolve('cryptojslib/rollups/sha1.js'),
          type: 'js'
        },
        {
          pattern: require.resolve('cryptojslib/components/enc-base64-min.js'),
          type: 'js'
        },
        {
          pattern: require.resolve('cryptojslib/rollups/md5.js'),
          type: 'js'
        },
        {
          pattern: require.resolve('cryptojslib/rollups/hmac-sha1.js'),
          type: 'js'
        },
        {
          pattern: require.resolve('jsrsasign/lib/jsrsasign-rsa-min.js'),
          type: 'js'
        }
      ],

      // see the karma-esm docs for all options
      esm: {
        // if you are using 'bare module imports' you will need this option
        nodeResolve: true
      },

      client: {
        mocha: {
          timeout: 10000
        }
      },

      coverageIstanbulReporter: {
        thresholds: {
          // emitWarning: true,
          global: {
            statements: 70,
            lines: 70,
            branches: 60,
            functions: 70
          },
          each: {
            statements: 80,
            lines: 80,
            branches: 80,
            functions: 90,
            overrides: {
              'src/OAuth1Authorization.js': {
                statements: 47,
                lines: 47,
                branches: 37,
                functions: 48
              }
            }
          }
        }
      }
    })
  );
  return config;
};
