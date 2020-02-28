/* eslint-disable import/no-extraneous-dependencies */
const merge = require('deepmerge');
const slSettings = require('@advanced-rest-client/testing-karma-sl/sl-settings.js');
const createBaseConfig = require('./karma.conf.js');

module.exports = (config) => {
  const slConfig = merge(slSettings(config), {
    sauceLabs: {
      testName: 'oauth-authorization'
    }
  });
  slConfig.browsers = ['SL_Chrome', 'SL_Chrome-1', 'SL_Firefox', 'SL_Firefox-1', 'SL_Safari', 'SL_EDGE'];
  // 'SL_Safari-1',
  config.set(merge(createBaseConfig(config), slConfig));
  return config;
};
