const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const cachePath = path.join(__dirname, 'CACHE');
const tempPath = path.join(__dirname, 'TEMP');
// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath;
process.env['RUNNER_TOOL_CACHE'] = cachePath;

import * as setup from '../src/setup-bazel';
import * as vi from '../src/version-info';

test('setup downloads bazel', async () => {
  const required_version: vi.VersionInfo = {
    name: '1.2.1',
    assets: [],
    url: '',
    draft: false,
    prerelease: false
  };
  await setup.addBazelToPath(required_version);
  // As the PATH is modified, have to explicitly set the env for the call to exec
  const { stdout, stderr } = await exec('bazel --version', {
    env: process.env
  });

  expect(stdout).toMatch(/bazel 1.2.1/);
});
