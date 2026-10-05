# Code signing policy

Free code signing provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

## Scope

Official Windows installers released from this repository may be Authenticode-signed through SignPath Foundation.

The signing pipeline is designed so that:

- release candidates are built on GitHub-hosted runners;
- the unsigned installer is first stored as a GitHub Actions artifact;
- SignPath verifies the GitHub build origin before signing;
- every SignPath Foundation release-signing request requires manual approval;
- signed releases are published only from the `main` branch;
- a signed `dev-latest` release is never silently replaced by an unsigned build once SignPath has been configured.

Unsigned CI artifacts may still be produced for testing. They are not represented as SignPath-signed releases.

## Project roles

- **Committers and reviewers:** repository maintainers with write access.
- **Approvers:** the repository owner and any explicitly designated SignPath release approvers.

Changes submitted by contributors without direct write access must be reviewed by a maintainer before merging. Release signing requests are separately approved in SignPath.

## Privacy

This fork inherits Cyd's network-facing functionality. Users should review the upstream Cyd privacy policy at <https://cyd.social/privacy/>. Fork-specific behavior is documented in [FORK_CHANGES.md](../FORK_CHANGES.md).

## Build and origin verification

Windows builds are produced by [`.github/workflows/build.yml`](../.github/workflows/build.yml) using GitHub-hosted runners.

The SignPath submission uses the official `signpath/github-action-submit-signing-request` action and submits a GitHub Actions artifact, allowing SignPath to verify that the binary originated from this repository's workflow.

The release signing policy should be restricted in SignPath to:

- repository: this repository;
- branch: `main`;
- trusted build system: GitHub.com;
- GitHub-hosted runners only;
- manual approval for every release.

## SignPath configuration

After SignPath Foundation accepts the project, configure the SignPath project as **Cyd** and create a release-signing policy.

Create an artifact configuration from an unsigned `CydDevSetup.exe` sample. For the initial integration, the workflow submits the standalone Windows installer as the artifact to sign. The artifact configuration should enforce the expected PE metadata and apply Authenticode signing.

Then add these repository settings in GitHub:

### Secret

- `SIGNPATH_API_TOKEN` — API token for a SignPath user/service identity with permission to submit to the release-signing policy.

### Repository variables

- `SIGNPATH_ORGANIZATION_ID`
- `SIGNPATH_PROJECT_SLUG`
- `SIGNPATH_SIGNING_POLICY_SLUG`
- `SIGNPATH_ARTIFACT_CONFIGURATION_SLUG`

Do not store the API token as a repository variable or commit it to the repository.

## Publishing a signed Windows release

Once all SignPath settings are present:

1. Open **Actions** → **Build and Test Cyd**.
2. Choose **Run workflow** on the `main` branch.
3. Enable **Submit the Windows installer to SignPath and publish the signed dev-latest release**.
4. Approve the signing request in SignPath.
5. The workflow downloads the signed artifact, verifies that Windows reports a valid Authenticode signature, computes the SHA-256 of the signed file, and publishes it as `CydDevSetup.exe` in the `dev-latest` prerelease.

When SignPath is configured, ordinary pushes to `main` continue to build and test but no longer overwrite the Windows `dev-latest` asset with an unsigned installer.
