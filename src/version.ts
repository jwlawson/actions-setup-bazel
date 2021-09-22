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

function getHttpOptions(
  api_token: string,
  page_number: number = 1
): rest.IRequestOptions {
  let options: rest.IRequestOptions = {};
  options.additionalHeaders = { Accept: 'application/vnd.github.v3+json' };
  if (page_number > 1) {
    options.queryParameters = { params: { page: page_number } };
  }
  if (api_token) {
    options.additionalHeaders.Authorization = 'token ' + api_token;
  }
  return options;
}

// Parse the pagination Link header to get the next url.
// The header has the form <...url...>; rel="...", <...>; rel="..."
function getNextFromLink(link: string): string | undefined {
  const rLink = /<(?<url>[A-Za-z0-9_?=.\/:-]*?)>; rel="(?<rel>\w*?)"/g;
  let match;
  while ((match = rLink.exec(link)) != null) {
    if (match.groups && /next/.test(match.groups.rel)) {
      return match.groups.url;
    }
  }
  return;
}

export async function getAllVersionInfo(
  api_token: string = ''
): Promise<vi.VersionInfo[]> {
  const client = new rest.RestClient(USER_AGENT);

  // Fetch the first page of releases and use that to extract any pagination links.
  const options = getHttpOptions(api_token);
  const version_response = await client.get<GitHubVersion[]>(
    VERSION_URL,
    options
  );
  if (version_response.statusCode != 200 || !version_response.result) {
    return [];
  }
  let raw_versions = version_response.result;
  let headers: { link?: string } = version_response.headers;
  if (headers.link) {
    let next = getNextFromLink(headers.link);
    while (next) {
      const options = getHttpOptions(api_token);
      const version_response = await client.get<GitHubVersion[]>(next, options);
      if (version_response.statusCode != 200 || !version_response.result) {
        break;
      }
      raw_versions = raw_versions.concat(version_response.result);
      headers = version_response.headers;
      if (!headers.link) {
        break;
      }
      next = getNextFromLink(headers.link);
    }
  }
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
