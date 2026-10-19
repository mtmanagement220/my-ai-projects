# NEXUS AI Live Dashboard

This static dashboard is intended to be hosted from this repository (for example, with GitHub Pages or another static host).

## Current live integration
- Reads recent GitHub Actions workflow runs from the public GitHub REST API for `mtmanagement220/my-ai-projects`.
- Polls every 30 seconds while open.
- Shows real workflow run state/conclusion and links to the real run page.
- Attempts to read jobs and report artifacts from the GitHub API.
- Provides shortcuts to Actions, repository and workflow setup PR.
- Does not contain a GitHub token, Firebase credentials, or AI provider API keys.
- Does not trigger deployments or change GitHub settings.

## Important limits
This is a static front-end. The GitHub REST API requests work only when the repository/actions data are publicly readable and the browser is not blocked by API rate limits. For private repository data, use a secure backend or GitHub App/OAuth integration; never put a personal access token in browser JavaScript. Artifact download links for private repositories may require signing in to GitHub.

The dashboard cannot reliably infer each internal audit stage from a single job. It displays real job data when available and clearly links to the full run for authoritative logs. Provider-specific AI status should be read from logs/report artifacts, not guessed from the overall run conclusion.

## Hosting
For GitHub Pages, publish from the repository's default branch and choose the `/ (root)` folder only if you want the root index. For this path, use a Pages workflow or configure the site to publish the `dashboard/` folder. Do not enable production deploy automatically unless that is an intentional, reviewed decision.

## Security and deployment
This dashboard's deployment button is not connected to production. Keep Netlify production publishing/automatic deploy disabled until the workflow and deployment approval controls are reviewed and tested. This UI does not replace GitHub Environment protection or a server-side approval gate.
