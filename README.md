# Setup bazel for GitHub Actions

GitHub action to setup the bazel build tool.

This action will update the path for your workflow to include a bazel
executable matching the platform and any version requirements.

### Usage

Adding a step that uses this action to your workflow will setup bazel
and make it available to subsequent steps:

```yaml
jobs:
  example:
    runs-on: ubuntu-latest
    steps:
    - name: Setup bazel
      uses: jwlawson/actions-setup-bazel@v1
      with:
        bazel-version: '2.0.0'
    - name: Use bazel
      run: bazel --version
```

### Options

There are two options for the action:

* `bazel-version` controls the version of bazel that is added to the path. This
  can be a fully specified verison `2.0.0`, partly specified `1.2`, a wildcard
  version `1.2.x`. By default it is empty which will give the latest bazel
  version available on GitHub.

  The [version tests] show some expected values for given versions.

* `github-api-token` is optional, but is used to authenticate with GitHub's
  API. This will default to the generated GitHub token for the pipeline but can
  be overridden. If set to blank then no authentication is used to access the
  API and there is a chance that the test runner will have hit the API rate
  limit causing the action to fail to download the available versions from
  GitHub.

  See also:
   - [GitHub API rate limiting]
   - [GITHUB_TOKEN]


### How it works

The action will download the list of releases of bazel available on GitHub and
choose the best match for the test runner's platform and the version
requirements given as as option.  The bazel executable is then either
downloaded from GitHub, or a cached version from the action's tool cache is
used, and provided on the path for subsequent workflow steps.


[version tests]: ./__tests__/version.test.ts
[GitHub API rate limiting]: https://developer.github.com/v3/#rate-limiting
[GITHUB_TOKEN]: https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret

