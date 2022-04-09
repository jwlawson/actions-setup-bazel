import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as vi from './version-info';

const IS_WINDOWS: boolean = process.platform === 'win32';

const PACKAGE_NAME: string = 'bazel';

function getURL(version: vi.VersionInfo): string {
  const matching_assets: vi.AssetInfo[] = version.assets.filter(
    (a) =>
      a.platform === process.platform &&
      a.filetype === 'exe' &&
      a.jdk &&
      a.arch === 'x86_64'
  );
  const num_found = matching_assets.length;
  if (num_found == 0) {
    throw new Error(
      `Could not find ${process.platform} asset for bazel version ${version.name}`
    );
  }
  if (num_found > 1) {
    throw new Error(
      `Found more than one matching asset for bazel version ${version.name}`
    );
  }
  const asset_url = matching_assets[0].url;
  core.debug(
    `Found 1 assets for ${process.platform} with version ${version.name}`
  );
  core.debug(`Using asset url ${asset_url}`);
  return asset_url;
}

function getFileName(): string {
  if (IS_WINDOWS) {
    return 'bazel.exe';
  } else {
    return 'bazel';
  }
}

export async function addBazelToToolCache(
  version: vi.VersionInfo
): Promise<string> {
  const binary = await tc.downloadTool(getURL(version));
  if (!IS_WINDOWS) {
    // The downloaded bazel file is not executable by default
    fs.chmodSync(binary, 0o777);
  }
  return await tc.cacheFile(binary, getFileName(), PACKAGE_NAME, version.name);
}

export async function addBazelToPath(version: vi.VersionInfo): Promise<void> {
  let tool: string = tc.find(PACKAGE_NAME, version.name);
  if (!tool) {
    tool = await addBazelToToolCache(version);
  }
  await core.addPath(tool);
}
