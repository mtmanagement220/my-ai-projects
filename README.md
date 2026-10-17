# Universal Project Audit & Repair Workflow

This repository is intended to host different projects over time. The workflow scans project files at the repository root or inside subfolders and does not assume one specific application.

## Upload and check a new project

1. Upload the new project's files to this repository (root or a dedicated folder). Do not upload `.env` files, passwords, API keys, build output, or `node_modules`.
2. Commit the upload to `main` to trigger the audit, or use **Actions → Universal Project Audit and Repair → Run workflow**.
3. Open the run and read the **Summary** first.
4. Download `project-audit-report-<run-id>` for the detailed logs.
5. If the workflow proposes code repairs, review the Pull Request diff and project-specific tests. Merge only after you approve it.

## What it checks

- Detects common project markers for Node.js/JavaScript, Python, Flutter/Dart, PHP, Java/Maven, Gradle/Android, Rust, Go and Docker.
- Runs JSON syntax, Python syntax and JavaScript syntax checks where applicable.
- Uses configured AI providers to audit code and, when appropriate, attempts limited fixes in the temporary runner workspace.
- Re-runs checks and produces a readable GitHub Actions summary and downloadable logs.
- Proposes changes in a Pull Request rather than committing AI repairs directly to `main`.

## Important limitations and safety

- A generic workflow cannot safely build and test every framework automatically. Framework-specific tests/build commands must be added after the uploaded project is identified. Arbitrary project install/build scripts are not run blindly because they can execute untrusted code.
- A passing syntax check or AI audit is not a guarantee that the app works or is secure.
- This workflow does not deploy to Production. Netlify's own Git integration and auto-publishing are separate controls. Keep Netlify auto-publishing disabled while you are testing the workflow; do not merge to `main` until you are comfortable with that hosting setting.
- The AI repair step only edits files it has read and is limited to project source/config files. Review all proposed changes before merging.

## Required GitHub Actions secrets

At least one AI provider key is required:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Optional email reporting:
- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`
- `GMAIL_TO`

## Operating sequence

**Upload → Detect project type → Static checks → AI audit → Limited repair attempt → Recheck → Detailed report → Human approval → (later, separately configured) Production deployment.**
