# Code signing policy

Free code signing provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

## Scope

Windows installers of this independently maintained Cyd fork released from this repository may be Authenticode-signed through SignPath Foundation.

The signing pipeline is designed so that:

- release candidates are built on GitHub-hosted runners;
- the unsigned installer is first stored as a GitHub Actions artifact;
- SignPath verifies the GitHub build origin before signing;
- every SignPath Foundation release-signing request requires manual approval;
- signed releases are published only from the `main` branch;
- a signed `dev-latest` release is never silently replaced by an unsigned build once SignPath has been configured.

Unsigned CI artifacts may still be produced for testing. They are not represented as SignPath-signed releases.

## Project roles

- **Author, committer, and reviewer:** [Gevroska](https://github.com/Gevroska), the owner of this fork. Any future maintainer must be listed here before receiving release responsibilities.
- **Release approver:** [Gevroska](https://github.com/Gevroska), to be assigned in SignPath after onboarding.

The maintainer confirms GitHub two-factor authentication is enabled. SignPath MFA must also be enabled before signing. With one maintainer, author and reviewer may be the same person; this policy does not claim independent review. Contributions must be reviewed before merging. The Foundation decides whether this fork's provenance, review process, and reputation qualify.

Changes submitted by contributors without direct write access must be reviewed by a maintainer before merging. Release signing requests are separately approved in SignPath.

## Privacy

This fork removes analytics, remote error reporting, Cyd accounts, progress/activity uploads, newsletter signup, and automatic upstream updates. The [fork privacy notice](privacy.md) describes local data and necessary platform connections, including Bluesky OAuth's upstream metadata/redirect service. It is bundled offline, linked from About, and summarized before first use. See [FORK_CHANGES.md](../FORK_CHANGES.md).

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

Create an artifact configuration from an unsigned `CydDevSetup.exe` sample. For the initial integration, the workflow submits the standalone Windows installer as the artifact to sign. The artifact configuration must require PE `ProductName` **Cyd** and a product/file version matching `package.json` for the unsigned input, and apply Authenticode signing. The workflow normalizes and verifies installer metadata before uploading the unsigned artifact, verifies the packaged app's metadata, and checks returned signed metadata again. Configure these same restrictions in SignPath; workflow checks do not replace SignPath's restrictions.

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

## Licensing and fork provenance

This repository and its local archive workspace are GPL-3.0-only. Preserve upstream copyright notices and bundled third-party license notices. Electron includes its own license and Chromium's third-party notices. Package dependency license identifiers are recorded in the [runtime dependency inventory](dependency-licenses.md) from `package-lock.json`; maintainers must review any added or unidentified component before including it in a signed build.

The upstream project is [lockdown-systems/cyd](https://github.com/lockdown-systems/cyd), which publishes signed builds under its own identity. Changes in this fork are described separately; they are not endorsed or signed by the upstream publisher. The Foundation's special requirements for modified forks, including upstream release provenance and code review, must be accepted during onboarding. The integration does not assert that approval has already been granted.
