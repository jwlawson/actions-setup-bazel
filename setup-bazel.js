const tc = require('@actions/tool-cache')
const core = require('@actions/core')
const fs = require('fs')

exports.getURL = function (version) {
  return 'https://github.com/bazelbuild/bazel/releases/download/1.2.1/bazel-1.2.1-linux-x86_64'
}

exports.addBazelToPath = async function (url) {
  const binary = await tc.downloadTool(url)
  fs.chmodSync(binary, 0o777)
  const cached_bin = await tc.cacheFile(binary, 'bazel', 'bazel', '1.2.1')
  await core.addPath(cached_bin)
}

