const path = require('path');
const nock = require('nock');
const dataPath = path.join(__dirname, 'data');

const version = require('../lib/version.js');

describe('When a version is needed', () => {
  beforeEach(() => {
    nock('https://api.github.com')
      .get('/repos/bazelbuild/bazel/releases')
      .replyWithFile(200, path.join(dataPath, 'releases.json'), {
        'Content-Type': 'application/json'
      });
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  it('latest version is correctly parsed', async done => {
    const version_info = await version.getAllVersionInfo();
    const latest = await version.getLatestVersion(version_info);
    expect(latest.name).toMatch(/2.0.0/)
    done();
  });
});
