# 0030: Remove telemetry and Cyd service accounts in the fork

Status: accepted for the Gevroska/cyd fork. Supersedes ADR 0029's remote diagnostic design for this fork.

The fork runs without Cyd accounts or billing services. No analytics events, account progress, activity, newsletter signup, error reports, or credential refresh are sent to upstream Cyd services. Legacy client interfaces are transport-free adapters; production callers no longer generate telemetry or read counters for submission.

Automation errors preserve only local retry/cancel state. They do not capture report screenshots, URLs, account names, payloads, or logs. Automatic upstream updates are removed to avoid contacting its service or replacing the modified application. Users open the fork's downloads manually.

Platform requests required by an explicitly started operation remain. Connectivity probes contact that platform. The published Bluesky OAuth metadata and redirect service remain part of Bluesky authentication and are disclosed in the bundled privacy notice. Local social account credentials, archives, and task counters remain functional.

Regression tests cover startup, legacy service methods with credentials, local error decisions, and absence of diagnostic capture. Packaged builds are checked for telemetry endpoints and for the bundled privacy notice.
