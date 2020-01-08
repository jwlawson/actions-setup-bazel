import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as vi from './version-info';

const IS_WINDOWS: boolean = process.platform === 'win32';

const PACKAGE_NAME: string = 'bazel';

function getURL(version: string): string {
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

function getFileName(): string {
  if (IS_WINDOWS) {
    return 'bazel.exe';
  } else {
    return 'bazel';
  }
}

async function addBazelToToolCache(version: string): Promise<string> {
  const binary = await tc.downloadTool(getURL(version));
  if (!IS_WINDOWS) {
    // The downloaded bazel file is not executable by default
    fs.chmodSync(binary, 0o777);
  }
  return await tc.cacheFile(binary, getFileName(), PACKAGE_NAME, version);
}

export async function addBazelToPath(version: vi.VersionInfo): Promise<void> {
  let tool: string = tc.find(PACKAGE_NAME, version.name);
  if (!tool) {
    tool = await addBazelToToolCache(version.name);
  }
  await core.addPath(tool);
}
