const path = require('path');
const nock = require('nock');

const cachePath = path.join(__dirname, 'CACHE');
const tempPath = path.join(__dirname, 'TEMP');
// Set temp and tool directories before importing (used to set global state)
process.env['RUNNER_TEMP'] = tempPath;
process.env['RUNNER_TOOL_CACHE'] = cachePath;

import * as setup from '../src/setup-bazel';
import * as vi from '../src/version-info';
import * as fs from 'fs';

afterEach(() => {
  fs.rmdirSync(cachePath, { recursive: true });
  fs.rmdirSync(tempPath, { recursive: true });
});

test('Download uses correct platform url', async () => {
  const required_version: vi.VersionInfo = {
    name: '1.2.1',
    assets: [
      {
        name: 'bazel-darwin-x86_64',
        platform: 'darwin',
        filetype: 'exe',
        url: 'https://fakeaddress.com/bazel-darwin-x86_64',
        jdk: true,
      },
      {
        name: 'bazel-linux-x86_64',
        platform: 'linux',
        filetype: 'exe',
        url: 'https://fakeaddress.com/bazel-linux-x86_64',
        jdk: true,
      },
      {
        name: 'bazel-windows-x86_64.exe',
        platform: 'win32',
        filetype: 'exe',
        url: 'https://fakeaddress.com/bazel-windows-x86_64.exe',
        jdk: true,
      },
    ],
    url: '',
    draft: false,
    prerelease: false,
  };
  nock.disableNetConnect();
  const darwin_nock = nock('https://fakeaddress.com')
    .get('/bazel-darwin-x86_64')
    .reply(200, { bazel_darwin: true });
  const linux_nock = nock('https://fakeaddress.com')
    .get('/bazel-linux-x86_64')
    .reply(200, { bazel_linux: true });
  const windows_nock = nock('https://fakeaddress.com')
    .get('/bazel-windows-x86_64.exe')
    .reply(200, { bazel_windows: true });

  await setup.addBazelToToolCache(required_version);
  if (process.platform === 'win32') {
    expect(darwin_nock.isDone()).toBe(false);
    expect(linux_nock.isDone()).toBe(false);
    expect(windows_nock.isDone()).toBe(true);
  } else if (process.platform === 'darwin') {
    expect(darwin_nock.isDone()).toBe(true);
    expect(linux_nock.isDone()).toBe(false);
    expect(windows_nock.isDone()).toBe(false);
  } else if (process.platform === 'linux') {
    expect(darwin_nock.isDone()).toBe(false);
    expect(linux_nock.isDone()).toBe(true);
    expect(windows_nock.isDone()).toBe(false);
  }

  nock.cleanAll();
  nock.enableNetConnect();
});

test('Filters out nojdk version', async () => {
  const required_version: vi.VersionInfo = {
    name: '4.0.0',
    assets: [
      {
        name: 'bazel-4.0.0-darwin-x86_64',
        platform: 'darwin',
        filetype: 'exe',
        url: 'https://url.test/bazel-4.0.0-darwin-x86_64',
        jdk: true,
      },
      {
        name: 'bazel_nojdk-4.0.0-darwin-x86_64',
        platform: 'darwin',
        filetype: 'exe',
        url: 'https://url.test/bazel_nojdk-4.0.0-darwin-x86_64',
        jdk: false,
      },
    ],
    url: '',
    draft: false,
    prerelease: false,
  };
  nock.disableNetConnect();
  const jdk_nock = nock('https://url.test')
    .get('/bazel-4.0.0-darwin-x86_64')
    .reply(200, {});
  const nojdk_nock = nock('https://url.test')
    .get('/bazel_nojdk-4.0.0-darwin-x86_64')
    .reply(200, {});

  const orig_platform: string = process.platform;
  Object.defineProperty(process, 'platform', {
    value: 'darwin',
  });
  expect(process.platform).toBe('darwin');

  await setup.addBazelToToolCache(required_version);
  expect(jdk_nock.isDone()).toBe(true);
  expect(nojdk_nock.isDone()).toBe(false);

  Object.defineProperty(process, 'platform', {
    value: orig_platform,
  });
  nock.cleanAll();
  nock.enableNetConnect();
});
