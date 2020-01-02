const tc = require('@actions/tool-cache');
const core = require('@actions/core');

const dl_url = 'https://github.com/bazelbuild/bazel/releases/download/2.0.0/bazel-2.0.0-linux-x86_64'
const binary = tc.downloadTool(dl_url)
const cached_bin = await tc.cacheFile(binary, 'bazel', 'bazel', '2.0.0')
core.addPath(cached_bin)
