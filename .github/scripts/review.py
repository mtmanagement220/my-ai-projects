import os
import json
import requests
from pathlib import Path

PROJECT_ROOT = Path("projects")

SUPPORTED_EXTENSIONS = {
    ".html",
    ".css",
    ".js",
    ".json",
    ".py",
    ".ts",
    ".tsx",
    ".jsx",
    ".vue",
    ".php",
    ".java",
    ".kt",
    ".xml",
    ".md"
}


def collect_files():
    files = []

    if not PROJECT_ROOT.exists():
        return files

    for path in PROJECT_ROOT.rglob("*"):

        if not path.is_file():
            continue

        if any(part in {
            ".git",
            "node_modules",
            "__pycache__",
            "dist",
            "build",
            ".next"
        } for part in path.parts):
            continue

        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        try:
            content = path.read_text(
                encoding="utf-8",
                errors="ignore"
            )
        except Exception:
            continue

        files.append({
            "path": str(path),
            "content": content
        })

    return files


def ask_ai(provider, prompt):
    try:

        if provider == "gemini":

            key = os.getenv("GEMINI_API_KEY")

            if not key:
                return "ERROR: GEMINI_API_KEY missing"

            url = (
                "https://generativelanguage.googleapis.com/"
                "v1beta/models/gemini-2.5-flash:generateContent"
                f"?key={key}"
            )

            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1
                }
            }

            r = requests.post(
                url,
                json=payload,
                timeout=90
            )

            if r.status_code != 200:
                return f"ERROR: Gemini HTTP {r.status_code}: {r.text[:1000]}"

            data = r.json()

            return data["candidates"][0]["content"]["parts"][0]["text"]


        if provider == "groq":

            key = os.getenv("GROQ_API_KEY")

            if not key:
                return "ERROR: GROQ_API_KEY missing"

            url = "https://api.groq.com/openai/v1/chat/completions"

            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "openai/gpt-oss-120b",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1
            }

            r = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=90
            )

            if r.status_code != 200:
                return f"ERROR: Groq HTTP {r.status_code}: {r.text[:1000]}"

            return r.json()["choices"][0]["message"]["content"]


        if provider == "openrouter":

            key = os.getenv("OPENROUTER_API_KEY")

            if not key:
                return "ERROR: OPENROUTER_API_KEY missing"

            url = "https://openrouter.ai/api/v1/chat/completions"

            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "openrouter/free",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1
            }

            r = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=90
            )

            if r.status_code != 200:
                return f"ERROR: OpenRouter HTTP {r.status_code}: {r.text[:1000]}"

            return r.json()["choices"][0]["message"]["content"]

    except Exception as e:
        return f"ERROR: {provider}: {type(e).__name__}: {e}"

    return "ERROR: Unknown provider"


def build_prompt(files):
    project = []

    for item in files:

        content = item["content"]

        # Avoid sending extremely large files completely.
        if len(content) > 50000:
            content = content[:50000] + "\n[FILE TRUNCATED]"

        project.append(
            f"""
========== FILE ==========
{item["path"]}

{content}
"""
        )

    project_text = "\n".join(project)

    return f"""
You are a senior software auditor.

Analyze this project as a real application.

IMPORTANT:

Do NOT redesign the application.

Do NOT remove working features.

Do NOT invent unrelated changes.

Find actual problems such as:

- JavaScript syntax errors
- HTML errors
- CSS errors
- broken file references
- missing files
- incorrect script loading
- Firebase configuration problems
- authentication problems
- data/storage problems
- runtime errors visible from code
- obvious security problems
- broken application logic
- incompatible code

Return ONLY this format:

STATUS: PASSED

or

STATUS: FAILED
PROBLEMS:
- path: exact file
  problem: clear explanation
  severity: HIGH/MEDIUM/LOW
  suggested_fix: specific repair

Do not mark something as failed merely because you dislike the design.

PROJECT:

{project_text}
"""


def main():

    files = collect_files()

    if not files:
        print("STATUS: FAILED")
        print("PROBLEMS:")
        print("- No supported project files found.")
        return 1

    print(f"Found {len(files)} project files.")

    prompt = build_prompt(files)

    providers = [
        "gemini",
        "groq",
        "openrouter"
    ]

    failures = []
    successful_checks = 0

    for provider in providers:

        print("")
        print("====================================")
        print(f"AI AUDIT: {provider.upper()}")
        print("====================================")

        result = ask_ai(provider, prompt)

        print(result)

        if result.startswith("ERROR:"):
            failures.append(provider)
            continue

        successful_checks += 1

        if "STATUS: FAILED" in result.upper():
            failures.append(provider)

    print("")
    print("====================================")
    print("AUDIT SUMMARY")
    print("====================================")

    print(f"Successful AI checks: {successful_checks}/3")

    if failures:
        print("Failed/problem providers:", ", ".join(failures))

    if successful_checks == 0:
        print("STATUS: FAILED")
        print("All AI providers failed.")
        return 1

    if failures:
        print("STATUS: FAILED")
        return 1

    print("STATUS: PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
