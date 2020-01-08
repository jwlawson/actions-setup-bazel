import * as rest from 'typed-rest-client/RestClient';
import * as semver from 'semver';
import * as vi from './version-info';

const VERSION_URL: string =
  'https://api.github.com/repos/bazelbuild/bazel/releases';
const USER_AGENT: string = 'jwlawson-actions-setup-bazel';

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubVersion {
  assets: GithubAsset[];
  url: string;
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
}

function extractPlatformFrom(filename: string): string {
  if (filename.match(/linux/)) {
    return 'linux';
  } else if (filename.match(/darwin/)) {
    return 'darwin';
  } else if (filename.match(/windows/)) {
    return 'win32';
  } else {
    return '';
  }
}

const KNOWN_EXTENSIONS: string[] = ['sig', 'sha256', 'sh', 'exe', 'zip', 'deb'];

function extractFileTypeFrom(filename: string): string {
  const ext = filename.split('.').pop() || '';
  if (KNOWN_EXTENSIONS.includes(ext)) {
    return ext;
  } else {
    return '';
  }
}

function convertToVersionInfo(versions: GitHubVersion[]): vi.VersionInfo[] {
  let result = new Array<vi.VersionInfo>();
  versions.map((v) => {
    let assets = new Array<vi.AssetInfo>();
    v.assets.map((a) => {
      assets.push({
        name: a.name,
        platform: extractPlatformFrom(a.name),
        filetype: extractFileTypeFrom(a.name),
        url: a.browser_download_url
      });
    });
    result.push({
      assets: assets,
      url: v.url,
      name: v.name,
      draft: v.draft,
      prerelease: v.prerelease
    });
  });
  return result;
}

export async function getAllVersionInfo(): Promise<vi.VersionInfo[]> {
  const client: rest.RestClient = new rest.RestClient(USER_AGENT);
  const version_response = await client.get<GitHubVersion[]>(VERSION_URL);
  const raw_versions: GitHubVersion[] = version_response.result || [];
  const versions: vi.VersionInfo[] = convertToVersionInfo(raw_versions);
  return versions;
}

async function getLatest(
  version_list: vi.VersionInfo[]
): Promise<vi.VersionInfo> {
  const sorted_versions: vi.VersionInfo[] = version_list.sort((a, b) =>
    semver.rcompare(a.name, b.name)
  );
  return sorted_versions[0];
}

export async function getLatestMatching(
  version: string,
  version_list: vi.VersionInfo[]
): Promise<vi.VersionInfo> {
  let matching_versions = version_list
    .filter((v) => !v.draft && !v.prerelease)
    .filter((v) => semver.satisfies(v.name, version));
  if (matching_versions.length == 0) {
    throw new Error('Unable to find version matching ' + version);
  }
  return getLatest(matching_versions);
}
