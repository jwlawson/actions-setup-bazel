import * as core from '@actions/core';
import * as setup from './setup-bazel';
import * as version from './version';

async function run() {
  try {
    const required_version = core.getInput('bazel-version');
    const all_version_info = await version.getAllVersionInfo();
    const bazel_version_info = await version.getLatestMatching(
      required_version,
      all_version_info
    );
    await setup.addBazelToPath(bazel_version_info.name);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
