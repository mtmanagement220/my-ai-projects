# Universal Project Audit and Repair Workflow

This repository is set up to review different projects without assuming that every upload uses the same framework.

## Upload a project

1. Upload the project into the repository, either at the root or in a separate folder. Keep each project's files together.
2. Commit the upload to `main` to trigger the audit, or run **Actions → Universal Project Audit and Repair → Run workflow**.
3. Open the workflow run and read the **Summary** first.
4. Download the `project-audit-report` artifact for the full report and attempt logs.
5. If AI proposes code changes, inspect the generated Pull Request and every changed file. Do not merge until you approve the changes.

## What the workflow does

- Looks for supported project/source files across the repository, not only `projects/`.
- Identifies common project types (Node.js, Python, Flutter/Dart, PHP, Java/Maven, Gradle/Android, Rust, Go, Docker).
- Runs available low-risk syntax checks for JSON, Python and JavaScript.
- Runs the configured AI audit providers and reports API/configuration failures instead of silently passing.
- Attempts bounded AI repairs in the temporary GitHub Actions workspace, then runs the final checks again.
- Publishes a readable run summary and a downloadable artifact with logs from the audit and repair attempts.
- Proposes code changes for human review; it does not directly commit AI repairs to `main`.

## Important limitations

Project detection is not the same as a complete build or runtime test. Framework-specific build/test commands are not automatically run for every technology. The report must clearly be reviewed, and the project's proper build/tests should be added when its framework is known.

The workflow does **not** deploy to Production. The production deployment workflow has been removed from this setup branch for now. Hosting-provider Git integration or auto-publishing is separate from GitHub Actions, so verify that Netlify automatic publishing is disabled before merging anything to `main`.

## Required GitHub Actions secrets

Configure at least one provider key:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Optional email reporting:
- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`
- `GMAIL_TO`

Never upload API keys, passwords, production credentials, or `.env` files into the repository. Store credentials in GitHub Actions secrets.

## Safe operating sequence

**Upload → Detect → Static checks → AI audit → Limited repair attempt → Recheck → Report → Human review/approval → (later, separately configured) manual deployment.**

A passing AI audit is not proof that a project is secure or defect-free. Review the evidence and run project-specific tests before approval.
