const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const nock = require('nock');

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

test('', async () => {
  const required_version: vi.VersionInfo = {
    name: '1.2.1',
    assets: [
      {
        name: 'bazel-linux-x86_64',
        platform: 'linux',
        filetype: 'exe',
        url: 'https://fakeaddress.com/bazel-linux-x86_64'
      },
      {
        name: 'bazel-windows-x86_64.exe',
        platform: 'win32',
        filetype: 'exe',
        url: 'https://fakeaddress.com/bazel-windows-x86_64.exe'
      }
    ],
    url: '',
    draft: false,
    prerelease: false
  };
  nock.disableNetConnect();
  const windows_nock = nock('https://fakeaddress.com')
    .get('/bazel-windows-x86_64.exe')
    .reply(200, { bazel_windows: true });
  const linux_nock = nock('https://fakeaddress.com')
    .get('/bazel-linux-x86_64')
    .reply(200, { bazel_linux: true });

  await setup.addBazelToToolCache(required_version);
  if (process.platform === 'win32') {
    expect(windows_nock.isDone()).toBe(true);
    expect(linux_nock.isDone()).toBe(false);
  } else {
    expect(windows_nock.isDone()).toBe(false);
    expect(linux_nock.isDone()).toBe(true);
  }
  nock.cleanAll();
  nock.enableNetConnect();
});
