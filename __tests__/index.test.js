const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const cachePath = path.join(__dirname, 'CACHE');
const tempPath = path.join(__dirname, 'TEMP');
// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath;
process.env['RUNNER_TOOL_CACHE'] = cachePath;

const setup = require('../setup-bazel.js');

test('setup downloads bazel', async () => {
  await setup.addBazelToPath('1.2.1');
  // As the PATH is modified, have to explicitly set the env for the call to exec
  const { stdout, stderr } = await exec('bazel --version', {
    env: process.env
  });

  expect(stdout).toMatch(/bazel 1.2.1/);
});
