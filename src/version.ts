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

export async function getLatestVersion(
  version_list: Version[]
): Promise<string> {
  let sorted_versions: string[] = version_list
    .map(v => v.name)
    .sort(semver.rcompare);
  return sorted_versions[0];
}
