const util = require('util');
const request = require('request');
//const request = util.promisify(require('request'));
//const request = require('request-promise');

const VERSION_URL = 'https://api.github.com/repos/bazelbuild/bazel/releases';
const USER_AGENT = 'jwlawson-actions-setup-bazel';

exports.getAllVersions = function() {
  const request_params = {
    method: 'GET',
    uri: VERSION_URL,
    headers: {
      'User-Agent': USER_AGENT
    }
  };
  let result;
  request(request_params)
    .on('response', resp => {
      console.log('code', resp.statusCode);
      console.log('headers', resp.headers);
      result = resp.body;
    })
    .on('error', err => {
      console.log('err', err);
    });
  return result;
};
