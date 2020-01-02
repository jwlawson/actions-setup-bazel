const tc = require('@actions/tool-cache')
const core = require('@actions/core')
const fs = require('fs')

const IS_WINDOWS = process.platform === 'win32'

function getURL(version) {
  const version_regex = /VERSION/gi
  const platform_regex = /PLATFORM/gi
  const template_url = 'https://github.com/bazelbuild/bazel/releases/download/VERSION/bazel-VERSION-PLATFORM'

  if (IS_WINDOWS) {
    return template_url.replace(version_regex, version).replace(platform_regex, 'windows-x86_64.exe')
  } else {
    return template_url.replace(version_regex, version).replace(platform_regex, 'linux-x86_64')
  }
}

exports.addBazelToPath = async function (version) {
  const binary = await tc.downloadTool(getURL(version))
  // The downloaded bazel file is not executable by default
  fs.chmodSync(binary, 0o777)
  const cached_bin = await tc.cacheFile(binary, 'bazel', 'bazel', version)
  await core.addPath(cached_bin)
}

