import * as core from '@actions/core';
import * as setup from './setup-bazel';
import * as version from './version';

async function run() {
  try {
    const requested_version = core.getInput('bazel-version');
    const required_version =
      requested_version === 'latest' ? '' : requested_version;
    const api_token = core.getInput('github-api-token');
    const all_version_info = await version.getAllVersionInfo(api_token);
    const bazel_version_info = await version.getLatestMatching(
      required_version,
      all_version_info
    );
    await setup.addBazelToPath(bazel_version_info);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}
run();
