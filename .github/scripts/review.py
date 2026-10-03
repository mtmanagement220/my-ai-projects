import os
import sys
import requests
from pathlib import Path


PROJECT_ROOT = Path("projects")

EXTENSIONS = {
    ".html",
    ".css",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".py",
    ".php",
    ".java",
    ".kt",
}


def collect_files():
    files = []

    if not PROJECT_ROOT.exists():
        return files

    for path in PROJECT_ROOT.rglob("*"):
        if not path.is_file():
            continue

        if ".git" in path.parts:
            continue

        if path.suffix.lower() not in EXTENSIONS:
            continue

        try:
            content = path.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            files.append({
                "path": str(path),
                "content": content
            })

        except Exception as e:
            print(f"Read error: {path} -> {e}")

    return files


def build_prompt(files):
    project = ""

    for item in files:
        project += f"""
==============================
FILE: {item["path"]}
==============================

{item["content"]}

"""

    return f"""
You are an expert software auditor.

Audit this project carefully.

Check:

- HTML errors
- CSS errors
- JavaScript errors
- runtime problems
- broken imports
- broken file paths
- broken links
- API problems
- Firebase problems
- authentication problems
- security vulnerabilities
- exposed secrets
- XSS
- injection
- dependency problems
- mobile responsiveness
- deployment problems
- logic errors
- obvious production-breaking issues

Do NOT modify files.

At the end write exactly:

STATUS: PASS

or

STATUS: FAILED

Then explain the important problems.

PROJECT:

{project}
"""


def gemini(prompt):
    key = os.getenv("GEMINI_API_KEY")

    if not key:
        return "API KEY MISSING"

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
        ]
    }

    r = requests.post(
        url,
        json=payload,
        timeout=120
    )

    if r.status_code != 200:
        return f"ERROR: Gemini {r.status_code}"

    data = r.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return str(data)


def groq(prompt):
    key = os.getenv("GROQ_API_KEY")

    if not key:
        return "API KEY MISSING"

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
        "temperature": 0
    }

    r = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=120
    )

    if r.status_code != 200:
        return f"ERROR: Groq {r.status_code}"

    data = r.json()

    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data)


def openrouter(prompt):
    key = os.getenv("OPENROUTER_API_KEY")

    if not key:
        return "API KEY MISSING"

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
        "temperature": 0
    }

    r = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=120
    )

    if r.status_code != 200:
        return f"ERROR: OpenRouter {r.status_code}"

    data = r.json()

    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data)


def main():

    files = collect_files()

    if not files:
        print("No supported project files found.")
        sys.exit(1)

    print(f"Found {len(files)} project files.")

    prompt = build_prompt(files)

    results = {
        "Gemini": gemini(prompt),
        "Groq": groq(prompt),
        "OpenRouter": openrouter(prompt)
    }

    failed = False

    for name, result in results.items():

        print("\n==============================")
        print(name)
        print("==============================")
        print(result)

        upper = result.upper()

        if "STATUS: FAILED" in upper:
            failed = True

        if "API KEY MISSING" in upper:
            failed = True

        if upper.startswith("ERROR"):
            failed = True

    print("\n==============================")
    print("FINAL RESULT")
    print("==============================")

    if failed:
        print("STATUS: FAILED")
        sys.exit(1)

    print("STATUS: PASS")


if __name__ == "__main__":
    main()
