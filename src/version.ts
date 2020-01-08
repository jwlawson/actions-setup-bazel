import * as rest from 'typed-rest-client/RestClient';
import * as semver from 'semver';

const VERSION_URL: string =
  'https://api.github.com/repos/bazelbuild/bazel/releases';
const USER_AGENT: string = 'jwlawson-actions-setup-bazel';

interface Asset {
  name: string;
  browser_download_url: string;
}

interface Version {
  assets: Asset[];
  url: string;
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
}

export async function getAllVersionInfo(): Promise<Version[]> {
  const client: rest.RestClient = new rest.RestClient(USER_AGENT);
  const version_response = await client.get<Version[]>(VERSION_URL);
  let versions: Version[] = version_response.result || [];
  return versions;
}

async function getLatest(version_list: Version[]): Promise<Version> {
  const sorted_versions: Version[] = version_list.sort((a, b) =>
    semver.rcompare(a.name, b.name)
  );
  return sorted_versions[0];
}

export async function getLatestMatching(
  version: string,
  version_list: Version[]
): Promise<Version> {
  let matching_versions = version_list
    .filter((v) => !v.draft && !v.prerelease)
    .filter((v) => semver.satisfies(v.name, version));
  if (matching_versions.length == 0) {
    throw new Error('Unable to find version matching ' + version);
  }
  return getLatest(matching_versions);
}
