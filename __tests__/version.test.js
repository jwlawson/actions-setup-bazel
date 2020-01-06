const path = require('path');
const nock = require('nock');
const dataPath = path.join(__dirname, 'data');

const version = require('../version.js');

describe('When a version is specified', () => {
  beforeEach(() => {
    nock('https://api.github.com')
      .log(console.log)
      .get('/repos/bazelbuild/bazel/releases')
      .replyWithFile(200, path.join(dataPath, 'releases.json'), {
        'Content-Type': 'application/json'
      });
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
  it('download dummy file', async done => {
    const resp = await version.getAllVersions();
    console.log(resp);
    done();
  });
});
