const path = require('path');
const nock = require('nock');
const dataPath = path.join(__dirname, 'data');

import * as version from '../src/version';

describe('When a version is needed', () => {
  beforeEach(() => {
    nock('https://api.github.com')
      .get('/repos/bazelbuild/bazel/releases')
      .replyWithFile(200, path.join(dataPath, 'releases.json'), {
        'Content-Type': 'application/json',
      });
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  it('latest version is correctly parsed', async () => {
    const version_info = await version.getAllVersionInfo();
    const latest = await version.getLatestMatching('', version_info);
    expect(latest.name).toMatch(/2.0.0/);
  });
  it('exact version is selected', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('1.2.1', version_info);
    expect(selected.name).toMatch(/1.2.1/);
  });
  it('latest version is selected for provided minor release', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('1.0', version_info);
    expect(selected.name).toMatch(/1.0.1/);
  });
  it('latest version is selected for provided minor release with x', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('1.0.x', version_info);
    expect(selected.name).toMatch(/1.0.1/);
  });
  it('latest version is selected for provided major release with x', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('0.x', version_info);
    expect(selected.name).toMatch(/0.29.1/);
  });
  it('non-existant full version throws', async () => {
    const version_info = await version.getAllVersionInfo();
    await expect(
      version.getLatestMatching('10.0.0', version_info)
    ).rejects.toThrow('Unable to find version matching 10.0.0');
  });
  it('non-existant part version throws', async () => {
    const version_info = await version.getAllVersionInfo();
    await expect(
      version.getLatestMatching('10.0.x', version_info)
    ).rejects.toThrow('Unable to find version matching 10.0');
  });
});

describe('When api token is required', () => {
  beforeEach(() => {
    nock('https://api.github.com', {
      reqheaders: {
        Authorization: 'token secret_token',
      },
    })
      .get('/repos/bazelbuild/bazel/releases')
      .replyWithFile(200, path.join(dataPath, 'releases.json'), {
        'Content-Type': 'application/json',
      });
    nock('https://api.github.com')
      .get('/repos/bazelbuild/bazel/releases')
      .replyWithError('Invalid API token');
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  it('includes api token in request', async () => {
    const version_info = await version.getAllVersionInfo('secret_token');
    expect(version_info).toEqual(expect.arrayContaining([expect.anything()]));
  });
  it('passing empty token gives error', async () => {
    await expect(version.getAllVersionInfo('')).rejects.toThrow(
      'Invalid API token'
    );
  });
  it('not passing token gives error', async () => {
    await expect(version.getAllVersionInfo()).rejects.toThrow(
      'Invalid API token'
    );
  });
});

describe('When providing versions without jdk', () => {
  const releases = [
    {
      name: '4.0.0',
      assets: [
        {
          name: 'bazel-4.0.0-darwin-x86_64',
          browser_download_url: 'https://url.test/bazel-4.0.0-darwin-x86_64',
        },
        {
          name: 'bazel_nojdk-4.0.0-darwin-x86_64',
          browser_download_url:
            'https://url.test/bazel_nojdk-4.0.0-darwin-x86_64',
        },
      ],
    },
  ];

  beforeEach(() => {
    nock.disableNetConnect();
    nock('https://api.github.com')
      .get('/repos/bazelbuild/bazel/releases')
      .reply(200, releases);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('correctly parses the version', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('', version_info);
    expect(selected.name).toMatch(/4.0.0/);
  });

  it('correctly parses the jdk archive', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('', version_info);
    const assets = selected.assets.filter((a) => a.jdk);
    expect(assets.length).toBe(1);
    expect(assets[0]).toEqual({
      name: 'bazel-4.0.0-darwin-x86_64',
      platform: 'darwin',
      filetype: 'exe',
      url: 'https://url.test/bazel-4.0.0-darwin-x86_64',
      jdk: true,
    });
  });

  it('correctly parses the nojdk archive', async () => {
    const version_info = await version.getAllVersionInfo();
    const selected = await version.getLatestMatching('', version_info);
    const assets = selected.assets.filter((a) => !a.jdk);
    expect(assets.length).toBe(1);
    expect(assets[0]).toEqual({
      name: 'bazel_nojdk-4.0.0-darwin-x86_64',
      platform: 'darwin',
      filetype: 'exe',
      url: 'https://url.test/bazel_nojdk-4.0.0-darwin-x86_64',
      jdk: false,
    });
  });
});
