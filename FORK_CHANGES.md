# Changes in This Fork

This repository, [Gevroska/cyd](https://github.com/Gevroska/cyd), is a fork of [lockdown-systems/cyd](https://github.com/lockdown-systems/cyd).

This document summarizes the intentional changes introduced in this fork compared with the upstream project.

## Comparison snapshot

The October 4, 2026 update synchronizes this fork with:

- Upstream: `lockdown-systems/cyd:main` at `9cb2aae3de934c06414d6e62cf9161611ec53fe0`
- Previous fork head: `58c137d4bec70265ca1331fbaa4709fb2c54f948`
- Application version after synchronization: **1.2.4**

All 121 previously missing upstream commits are incorporated with their history. The fork's existing features below are retained, and this update adds reply-tweet protection and removes the packaged development startup dialog. Upstream's retirement of X direct-message management is retained: X's changed messaging platform no longer supports the previous workflow. Existing local archives are not deleted by the update.

## 1. Client-side premium gating is disabled

The fork removes the desktop application's client-side premium restrictions for X and Facebook workflows.

Notable changes include:

- `hasPremiumGating` is disabled in the X and Facebook platform configuration.
- `xRequiresPremium()` no longer marks X jobs as requiring premium access.
- X jobs no longer redirect users through the premium-check flow before starting.
- Facebook's delete-options flow no longer blocks access based on premium status.
- Premium badges were removed from the affected X deletion and Bluesky migration UI.
- Features that were previously treated as premium-only by the desktop client can therefore be started without the local premium gate.

This affects, among other things, advanced X deletion options, deleting likes/bookmarks, unfollowing, and Bluesky migration where those workflows were previously guarded by the application's premium checks.

These changes concern the client-side application logic in this fork; they do not make any claim about external services or server-side behavior.

## 2. X likes can be deleted by the date they were liked

The fork adds an age filter specifically for X likes.

### New settings

Two X account settings were added:

- `deleteLikesDaysOldEnabled`
- `deleteLikesDaysOld`

The delete-options wizard now exposes an "older than" setting for likes, and the review screen shows the configured age condition.

### Data model

A `likedAt` column was added to the X tweet database so the application can retain the date a tweet was liked when that information is available.

### Deletion behavior

When the filter is enabled, the fork selects likes using:

```sql
COALESCE(t.likedAt, t.createdAt)
```

This means:

- `likedAt` is preferred when available.
- The tweet creation date is used as a fallback for older/imported data that has no stored liked date.

Tests were added for the new filtering behavior.

## 3. Optional protection for pinned X posts

The fork adds a **keep pinned tweets** option to X tweet deletion.

### New setting

The X account model and database now include:

- `deleteTweetsKeepPinned`

The option is exposed in the advanced tweet-deletion settings.

### How pinned posts are detected

The fork reads `pinned_tweet_ids_str` from X's viewer GraphQL response and stores the validated pinned tweet IDs in the account configuration.

Before an actual tweet-deletion run starts, the application refreshes this information. If pinned-post protection is enabled and the current pinned IDs cannot be safely verified, the deletion job stops instead of proceeding with potentially stale data.

### Deletion filtering

Tweet selection and unarchived-tweet counting share a common deletion WHERE-clause builder. When pinned-post protection is enabled, known pinned tweet IDs are excluded from the deletion query.

The review phase is intentionally allowed to run before an existing account has refreshed its pinned-post cache; the stricter verification is performed when the destructive deletion job actually begins.

Tests cover pinned-post exclusion and the pre-refresh review behavior.

### Optional protection for X reply tweets

The advanced tweet-deletion settings include **Do not delete my reply tweets**.
The per-account `deleteTweetsKeepReplies` setting defaults to off and is saved
across app restarts. The review screen confirms when replies will be kept.

When enabled, deletion and its review/unarchived counts select only known
non-replies with no stored reply parent. This protects replies to other users
and replies to the account's own tweets, including thread continuations.
Standalone mentions and quote tweets remain eligible under the other deletion
filters. Live X indexing and X archive imports both already store the reply
metadata used by this filter. It can be combined with pinned-tweet, age, and
engagement protections.

### Startup presentation

Packaged builds no longer show the **Cyd Dev** information dialog on launch
("It uses the dev server and it might contain bugs"). They open the main Cyd
window directly. The existing installation and account-storage identities are
retained so this update keeps using the user's saved accounts and settings.
The local/open developer-mode notices remain available for those build modes.

## 4. Updated X navigation for likes and bookmarks

The fork adapts automation to X's newer history URLs.

### Likes

Likes indexing and deletion now navigate directly to:

```text
https://x.com/i/history/likes
```

instead of the older profile-based `/<username>/likes` route.

### Bookmarks

Bookmark indexing and deletion now use:

```text
https://x.com/i/history
```

instead of `/i/bookmarks`.

These direct routes are retained alongside upstream's expected-redirect handling and its separate original-post, reply, and repost indexing routes.

## 5. Production API usage and developer UI cleanup

The fork removes several development-oriented behaviors from the normal application UI/configuration.

Changes include:

- The MITM/proxy readiness check uses `https://api.cyd.social/health` instead of the development API.
- The renderer Content Security Policy no longer permits the local development API or `dev-api.cyd.social`; its API connection target is restricted to `https://api.cyd.social`.
- The Advanced Settings entry and modal were removed from the normal application UI.

## 6. Custom GitHub Actions build and test workflow

The fork has its own `.github/workflows/build.yml` workflow.

### Unified testing and building

Testing was merged into the build workflow, and the separate `.github/workflows/tests.yml` workflow was removed.

For pull requests, the workflow runs an Ubuntu test job that:

- installs Node.js 24 and npm 12.0.2, matching the updated upstream toolchain,
- installs the Linux/Electron test dependencies,
- installs npm dependencies,
- rebuilds `better-sqlite3` for Electron,
- runs linting,
- runs the CI test suite under Xvfb.

For pushes to `main` and manual runs, the workflow builds on both:

- `windows-latest`
- `ubuntu-latest`

The Ubuntu build also runs linting and tests before packaging. Both platforms verify the packaged application's reply-protection setting and label, retained pinned/likes features, version, and absence of the development startup message. On Windows, the verification also compares the actual `app.asar` in the full Squirrel package with the application that was just built.

### CI packages the code that was just built

For non-release Windows builds, Electron Forge/Squirrel no longer uses the upstream remote release history.

`remoteReleases` is only configured when `WINDOWS_RELEASE=true`.

This avoids a development/CI Squirrel package accidentally incorporating a newer package from the upstream release server instead of packaging the application produced by the current CI checkout.

## 7. Standalone Windows installer publishing

In addition to the normal GitHub Actions artifact containing the build output, a publication job publishes a standalone installer after both platform builds and their checks succeed.

The workflow:

1. Builds the development application with `npm run make-dev`.
2. Searches the generated Squirrel output for the Setup executable.
3. Copies it to the stable filename:
   ```text
   CydDevSetup.exe
   ```
4. Publishes that executable to the rolling prerelease:
   ```text
   dev-latest
   ```
5. Replaces the existing asset when a newer build is produced.
6. Moves the `dev-latest` Git tag to the commit that produced the current installer.
7. Records that commit and the installer's SHA256 checksum in the release notes, and fails the job if uploading or updating the release/tag fails.

As a result, consumers can download `CydDevSetup.exe` directly without first extracting it from the full Windows artifact ZIP.

## 8. CI run deduplication

The build workflow defines a concurrency group based on the Git ref and enables:

```yaml
cancel-in-progress: true
```

When a newer run for the same branch/ref starts, an older in-progress run can be cancelled instead of continuing to consume CI time for an obsolete commit.

## Key fork-specific commits

Representative commits implementing the changes above include:

- `461d9b7` — Unlock premium-gated app features
- `ce1c680` — Refine X delete-like filters and remove dev settings
- `9748ee9` — Fix X likes page navigation
- `89f682c` — Fix X bookmarks page navigation
- `2bc2d35` — Protect pinned tweets from deletion
- `886dd41` — Avoid blocking review before pin refresh
- `a25a4c4` — Package the app built by CI
- `599b4f4` — Merge tests into build workflow and fix installer publishing
- `4a13b99` — Remove standalone tests workflow
- `c6cfcfb` — Cancel stale runs and advance the `dev-latest` tag

## Upstream synchronization note

This update merges upstream through `9cb2aae3de934c06414d6e62cf9161611ec53fe0`, including the new Bluesky account/OAuth model, credential persistence, X timeline corrections, direct-message retirement, and dependency/build upgrades. Schema migrations retain the fork's existing pinned-tweet setting and add reply protection with a default of off.

When updating this fork from upstream, the custom behavior documented above should be reviewed carefully during conflict resolution so that upstream changes do not unintentionally remove or alter fork-specific functionality.

## Privacy and signing preparation

- Remove Plausible events and Cyd service account, progress, activity, newsletter, and diagnostic uploads; retain transport-free compatibility interfaces for upstream integration.
- Replace report submission with a local retry/cancel notice, without screenshots, account labels, page URLs, diagnostic payloads, or report logs.
- Stop automatic upstream updates; open this fork's downloads only on user request.
- Probe the selected social platform for connectivity. Preserve platform actions, local archives, credentials, and progress counters; disclose the existing Bluesky OAuth metadata and redirect service.
- Bundle the fork's privacy notice and license, show a first-use privacy summary, and document Windows uninstall/data retention.
- Set and verify Windows ProductName Cyd and versions from package.json before SignPath origin verification; require the same restrictions in SignPath configuration.
- Correct the package licenses to GPL-3.0-only and document public release roles. SignPath acceptance, reputation, and review-process approval remain external requirements.

## Local diagnostic logs

- Restore local file logging without restoring analytics or remote error-report uploads.
- Append across application sessions without clearing the entries before a crash. Add a timestamped session-start marker.
- Write synchronously and keep `main.log` plus nine size-based backups (`main.1.log` through `main.9.log`), approximately 1 MiB each and 10 MiB total. Replace the oldest file only when the active file reaches its size threshold.
- Filter successful SQL statements and repetitive account refreshes from the file history; preserve other debug messages and all warnings/errors. Log failed SQL with redacted parameters.
- Enable local native crash minidumps before application windows are created, using Electron Crashpad with uploads disabled and no server configured. Store dumps separately in the application's `crash-dumps` directory without changing Windows error-reporting settings.
- Initialize file logging only after the single-instance lock is acquired and outside Squirrel installer events. Preserve an existing legacy `main.old.log` as the first numbered backup when migrating.
- Update the bundled privacy notice to describe these local files.
