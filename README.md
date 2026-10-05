![Cyd](./assets/cyd-readme-header.png)

# Cyd: Claw back your data from Big Tech

This repository is an independently maintained fork of [lockdown-systems/cyd](https://github.com/lockdown-systems/cyd). Its changes are listed in [FORK_CHANGES.md](FORK_CHANGES.md). It runs without Cyd service accounts, usage analytics, or remote error reports.

Tech platforms can't be trusted. It's time to regain control of your data. [Cyd](https://cyd.social/) is an open source app for Windows, Mac, and Linux that lets you back up and selectively delete your data, and migrate it to open platforms.

At the moment, Cyd supports the following platforms:

- X (formerly Twitter)
- _More platforms coming soon..._

## Get started

Download this fork's Windows installer from [its GitHub releases](https://github.com/Gevroska/cyd/releases/tag/dev-latest). Read the [privacy notice](docs/privacy.md). Development installers are unsigned. The original project's downloads are available at [cyd.social](https://cyd.social/download/).

## Documentation

Local diagnostic files are off by default. To collect logs and native crash dumps for a troubleshooting session, close Cyd and launch its executable with `-debug` (or `--debug`). See the [privacy notice](docs/privacy.md) for locations and 24-hour dump retention.

Learn all about how to use Cyd, what features it has, and how to get involved in the open source project, including how to request features and report bugs, at the [Cyd Documentation](https://docs.cyd.social) website.

## Contributing

Read the our [For Contributors](https://cyd.social/docs/contributing/contributors) page for the Code of Conduct, legal stuff, etc.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to build and run Cyd from source.

## Privacy and installation

This independently maintained fork runs without Cyd accounts, analytics, usage uploads, or remote error reports. Archives and account sessions stay local. See the [privacy notice](docs/privacy.md) for platform connections and the retained Bluesky OAuth metadata/redirect service. The notice is bundled with the application and summarized before first use.

Download the Windows installer from this fork's [releases](https://github.com/Gevroska/cyd/releases/tag/dev-latest). It backs up, selectively deletes, and migrates social media data. Current development installers are unsigned. Uninstall Cyd Dev through Windows Settings → Apps; local archives and settings are retained. Review the privacy notice before removing those files.
