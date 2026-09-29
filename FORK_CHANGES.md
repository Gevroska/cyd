# Changes in This Fork

This repository, [Gevroska/cyd](https://github.com/Gevroska/cyd), is a fork of [lockdown-systems/cyd](https://github.com/lockdown-systems/cyd).

This document summarizes the intentional changes introduced in this fork compared with the upstream project. It focuses on fork-specific behavior rather than every line-level difference caused by upstream development that has not yet been merged here.

## Comparison snapshot

The comparison used to prepare this document was made between:

- Upstream: `lockdown-systems/cyd:main` at `9cb2aae3de934c06414d6e62cf9161611ec53fe0`
- This fork: `Gevroska/cyd:main` at `c6cfcfb18bd5f2cacc823d6af2ebe23fdfa92255`
- Merge base: `daa7bf0fae893e73afb26041fb832dd35dfdd96b`

At that snapshot, the branches had diverged: this fork contained 23 commits not present upstream, while upstream contained 121 commits not present in this fork. Because of that, the sections below describe the changes intentionally added by this fork, not unrelated newer upstream work that is simply absent here.

## 1. Client-side premium gating is disabled

The fork removes the desktop application's client-side premium restrictions for X and Facebook workflows.

Notable changes include:

- `hasPremiumGating` is disabled in the X and Facebook platform configuration.
- `xRequiresPremium()` no longer marks X jobs as requiring premium access.
- X jobs no longer redirect users through the premium-check flow before starting.
- Facebook's delete-options flow no longer blocks access based on premium status.
- Premium badges were removed from the affected X deletion and Bluesky migration UI.
- Features that were previously treated as premium-only by the desktop client can therefore be started without the local premium gate.

This affects, among other things, advanced X deletion options, deleting likes/bookmarks/DMs, unfollowing, and Bluesky migration where those workflows were previously guarded by the application's premium checks.

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

These changes keep the automation aligned with the current X navigation used by the affected workflows.

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

- installs Node.js 22,
- installs the Linux/Electron test dependencies,
- installs npm dependencies,
- rebuilds `better-sqlite3` for Electron,
- runs linting,
- runs the CI test suite under Xvfb.

For pushes to `main` and manual runs, the workflow builds on both:

- `windows-latest`
- `ubuntu-latest`

The Ubuntu build also runs linting and tests before packaging.

### CI packages the code that was just built

For non-release Windows builds, Electron Forge/Squirrel no longer uses the upstream remote release history.

`remoteReleases` is only configured when `WINDOWS_RELEASE=true`.

This avoids a development/CI Squirrel package accidentally incorporating a newer package from the upstream release server instead of packaging the application produced by the current CI checkout.

## 7. Standalone Windows installer publishing

In addition to the normal GitHub Actions artifact containing the build output, the Windows job publishes a standalone installer.

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

This fork has also merged upstream changes in the past, including the merge recorded by commit `11a5c23d`. However, upstream has continued to develop since that synchronization point.

When updating this fork from upstream, the custom behavior documented above should be reviewed carefully during conflict resolution so that upstream changes do not unintentionally remove or alter fork-specific functionality.
