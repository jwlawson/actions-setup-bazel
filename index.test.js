const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path')

const cachePath = path.join(__dirname, 'CACHE')
const tempPath = path.join(__dirname, 'TEMP')
// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath
process.env['RUNNER_TOOL_CACHE'] = cachePath

const setup = require('./setup-bazel.js');
const core = require('@actions/core');

test('setup downloads bazel', async () => {
  const url = setup.getURL('2.0.0')
  await setup.addBazelToPath(url)
  // As the PATH is modified, have to explicitly set the env for the call to exec
  const {stdout, stderr} = await exec('bazel --version', {'env': process.env})

  expect(stdout).toMatch(/bazel/)
  expect(stdout).toMatch(/1.2.1/)
});
