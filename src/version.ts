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
    if (filename.endsWith('x86_64')) {
      // Special case for unix executables
      return 'exe';
    }
    return '';
  }
}

function convertToVersionInfo(versions: GitHubVersion[]): vi.VersionInfo[] {
  const results = versions.map((v) => {
    const assets = v.assets.reduce(
      (result: vi.AssetInfo[], a: GithubAsset) =>
        result.concat({
          name: a.name,
          platform: extractPlatformFrom(a.name),
          filetype: extractFileTypeFrom(a.name),
          url: a.browser_download_url,
          jdk: !/nojdk/.test(a.name),
        }),
      []
    );
    const version: vi.VersionInfo = {
      assets: assets,
      url: v.url,
      name: v.name,
      draft: v.draft,
      prerelease: v.prerelease,
    };
    return version;
  });
  return results;
}

function getHttpOptions(api_token: string): rest.IRequestOptions {
  if (api_token) {
    return { additionalHeaders: { Authorization: 'token ' + api_token } };
  } else {
    return {};
  }
}

export async function getAllVersionInfo(
  api_token: string = ''
): Promise<vi.VersionInfo[]> {
  const client: rest.RestClient = new rest.RestClient(USER_AGENT);
  const options = getHttpOptions(api_token);
  const version_response = await client.get<GitHubVersion[]>(
    VERSION_URL,
    options
  );
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
  const matching_versions = version_list
    .filter((v) => !v.draft && !v.prerelease)
    .filter((v) => semver.satisfies(v.name, version));
  if (matching_versions.length == 0) {
    throw new Error('Unable to find version matching ' + version);
  }
  return getLatest(matching_versions);
}
