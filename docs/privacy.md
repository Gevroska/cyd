# Privacy notice for this Cyd fork

This notice applies to the independently maintained [Gevroska/cyd fork](https://github.com/Gevroska/cyd), licensed under GPL-3.0-only. It describes this fork's application, not the original Cyd website or its services.

## No analytics or remote error reporting

This fork does not send usage events, account identifiers, progress counters, activity records, email addresses, device names, screenshots, or error reports to Cyd's services or Plausible. Cyd account registration, newsletter subscription, token refresh, premium billing links, automatic upstream update checks, and their network transports are removed. There is no telemetry queue or opt-in report submission.

An automation failure keeps only a local error category and account reference so that you can retry or cancel. It does not capture a screenshot, page URL, account username, payload, or diagnostic log for a report. Ordinary installations do not write diagnostic log files.

## Data stored on your computer

The app stores the social accounts you add, session credentials protected by the operating system, settings, local task history and counters, and the archives you ask it to create. These are necessary to perform your actions and display their results. Archives can contain posts, messages, usernames, and media. Protect them as personal files; they are not uploaded to the fork maintainer.

Old upstream Cyd service credentials may remain in an existing settings database, but this fork neither reads nor refreshes them. Existing local archives are preserved.

## Connections needed for your actions

Connecting a social account or running a backup, deletion, or migration contacts the selected platform (X, Facebook, or Bluesky), its identity providers, APIs, and media hosts. Connectivity probes use the selected platform, not a Cyd health endpoint. Those services can receive your IP address, request metadata, authentication, and the data needed for the operation, under their own policies. Embedded platform pages may contain the platform's own tracking; this fork cannot promise to prevent all third-party tracking inside those pages.

Bluesky OAuth currently uses upstream Cyd's public client metadata and OAuth redirect service in addition to Bluesky's authorization services. These are required by the published OAuth client configuration; they are not analytics endpoints. The redirect service can process connection metadata and OAuth callback parameters. Review the [upstream service privacy notice](https://cyd.social/privacy/) before using that connection. Other platforms' sessions are local to their embedded browser.

The app does not check for or download updates automatically. Selecting **Check for updates** opens this fork's GitHub releases in your browser. Documentation, credits, and other external links contact their destination only when you open them, under that site's policies.

## Notice, control, and removal

This notice is bundled as `resources/privacy.md`, available offline from **About → Privacy Policy**, and summarized on first launch before connecting a platform. Analytics and report uploads cannot be enabled in this fork. Disconnect or remove a social account from the app to stop using its session. Removing an account or uninstalling the program does not undo actions already taken on a platform.

On Windows, uninstall **Cyd Dev** through **Settings → Apps → Installed apps**. Uninstallation retains local settings and saved archives. The default application data directory is `%APPDATA%\Cyd Dev` (or `%APPDATA%\cyd` for production mode); the chosen archive directory can be elsewhere. Back up anything you need before manually removing those files. Deletion or migration actions on social platforms can be irreversible and are explained in the task's review screen.

For questions about this fork, use its [GitHub issue tracker](https://github.com/Gevroska/cyd/issues). Do not attach credentials or private archives to a public issue.
