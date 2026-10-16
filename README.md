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

This is a starter audit pipeline, not a universal proof of correctness. Framework-specific build/test commands (for example, React, Next.js, Flutter, Android, PHP, or Java) should be configured and run in isolated jobs before considering a project production-ready. The workflow does **not** deploy directly. Existing Vercel/Netlify integrations may deploy after a reviewed merge to `main`; manage their production-branch and approval settings in those services.

## Required repository secrets

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

The workflow can run with one or more configured AI providers; missing provider keys are skipped. If all provider keys are missing or every configured provider errors, the audit fails closed.

Optional email report secrets: `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD`, `GMAIL_TO`.

Never commit API keys, passwords, production credentials, or environment files. Keep them in GitHub Actions secrets.

## Safety

AI changes are proposed in a pull request, not pushed directly to `main`. Audit failures must be investigated; an AI PASS alone does not prove a project is secure or bug-free. Do not merge or deploy until the relevant checks and a human review pass.
