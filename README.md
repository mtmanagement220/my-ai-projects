# Universal AI Project Audit

This repository stores projects separately under `projects/`.

## Add a project

1. Create a new folder, for example `projects/project2/`.
2. Upload the complete project files into that folder. Keep each project self-contained.
3. Commit/push the files to `main` to start the audit, or open **Actions → Universal Project Audit and Repair → Run workflow**.
4. Check the workflow result and download the `project-audit-report` artifact if a check fails.
5. Review any AI repair pull request carefully. Merge only after the checks pass and you understand the changes.

## What is checked

- JSON syntax.
- Python syntax (without executing the project).
- JavaScript syntax for `.js`, `.mjs`, and `.cjs`.
- AI review by configured providers (Gemini, Groq, and OpenRouter).
- Up to three bounded AI repair attempts, followed by final checks.

This is a starter audit pipeline, not a universal proof of correctness. Framework-specific build/test commands (for example, React, Next.js, Flutter, Android, PHP, or Java) should be configured and run in isolated jobs before considering a project production-ready. The audit workflow does **not** deploy. Production deployment is available only through **Actions → Manual Production Deployment → Run workflow**, where you must choose `YES` and select either Vercel or Netlify. The deployment workflow requires a successful audit for the exact selected commit and uses the configured deploy hook. A hook response means the request was accepted, not that the live site has passed a smoke test.\n\n**Important before merging this setup:** Vercel and Netlify Git integrations can still automatically deploy when `main` changes, independently of GitHub Actions. Disable automatic production deployments in the hosting provider(s) first, or configure their production deploy behavior to require a manual action. Otherwise merging to `main` may still deploy automatically outside these workflows.

## Required repository secrets

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

The workflow can run with one or more configured AI providers; missing provider keys are skipped. If all provider keys are missing or every configured provider errors, the audit fails closed.

Optional email report secrets: `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD`, `GMAIL_TO`.

Never commit API keys, passwords, production credentials, or environment files. Keep them in GitHub Actions secrets.

## Safety

AI changes are proposed in a pull request, not pushed directly to `main`. Audit failures must be investigated; an AI PASS alone does not prove a project is secure or bug-free. Do not merge or deploy until the relevant checks and a human review pass.


## Readable audit results

After each audit run, open the GitHub Actions run page. The report appears in the run summary and is also included in the downloadable artifact named `project-audit-report-<run-id>`.

The report shows:
- Overall result: passed, failed, or incomplete.
- Repository, branch, commit, and run link.
- Initial and final static-check output.
- Final AI audit findings, including problem path, severity, and suggested fix when the AI provides them.
- Logs from each audit/repair attempt.

If a check fails, open the final report first, then inspect the full logs in the artifact. Review all proposed code changes in the pull request before merging. No AI audit can guarantee that every bug or security issue has been found.
