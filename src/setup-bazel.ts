import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';

const IS_WINDOWS: boolean = process.platform === 'win32';

const PACKAGE_NAME: string = 'bazel';

function getURL(version: string) {
  const version_regex = /VERSION/gi;
  const platform_regex = /PLATFORM/gi;
  const template_url =
    'https://github.com/bazelbuild/bazel/releases/download/VERSION/bazel-VERSION-PLATFORM';

  if (IS_WINDOWS) {
    return template_url
      .replace(version_regex, version)
      .replace(platform_regex, 'windows-x86_64.exe');
  } else {
    return template_url
      .replace(version_regex, version)
      .replace(platform_regex, 'linux-x86_64');
  }
}

function getFileName() {
  if (IS_WINDOWS) {
    return 'bazel.exe';
  } else {
    return 'bazel';
  }
}

async function addBazelToToolCache(version: string) {
  const binary = await tc.downloadTool(getURL(version));
  if (!IS_WINDOWS) {
    // The downloaded bazel file is not executable by default
    fs.chmodSync(binary, 0o777);
  }
  return await tc.cacheFile(binary, getFileName(), PACKAGE_NAME, version);
}

export async function addBazelToPath(version: string) {
  let tool = tc.find(PACKAGE_NAME, version);
  if (!tool) {
    tool = await addBazelToToolCache(version);
  }
  await core.addPath(tool);
}
