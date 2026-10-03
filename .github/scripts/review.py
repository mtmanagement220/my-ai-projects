import os
import sys
import json
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


def collect_project():
    files = []

    if not PROJECT_ROOT.exists():
        print("ERROR: projects directory not found.")
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
            print(f"Could not read {path}: {e}")

    return files


def build_prompt(files):
    project_text = ""

    for item in files:
        project_text += f"""
==============================
FILE: {item["path"]}
==============================

{item["content"]}

"""

    return f"""
You are the main AI software security and code auditor.

Analyze the uploaded project.

Check:

1. Syntax errors
2. Runtime errors
3. JavaScript errors
4. HTML errors
5. CSS problems
6. Broken imports
7. Broken links
8. API problems
9. Firebase problems
10. Authentication problems
11. Security vulnerabilities
12. XSS
13. Injection
14. Exposed API keys
15. Hardcoded passwords
16. Broken dependencies
17. Mobile responsiveness
18. Deployment problems
19. Logic errors
20. Performance problems
21. Missing files
22. Incorrect file references
23. Console errors
24. Obvious production-breaking problems

Do NOT modify anything.

At the end MUST return exactly one of:

STATUS: PASS

or

STATUS: FAILED

Then explain the important findings.

PROJECT:

{project_text}
"""


def call_gemini(prompt):
    key = os.getenv("GEMINI_API_KEY")

    if not key:
        return "Gemini API key missing."

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.5-flash:generateContent"
        f"?key={key}"
    )

    data = {
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

    response = requests.post(
        url,
        json=data,
        timeout=120
    )

    if response.status_code != 200:
        return f"Gemini error {response.status_code}: {response.text}"

    result = response.json()

    try:
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return json.dumps(result)


def call_groq(prompt):
    key = os.getenv("GROQ_API_KEY")

    if not key:
        return "Groq API key missing."

    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openai/gpt-oss-120b",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0
    }

    response = requests.post(
        url,
        headers=headers,
        json=data,
        timeout=120
    )

    if response.status_code != 200:
        return f"Groq error {response.status_code}: {response.text}"

    result = response.json()

    try:
        return result["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(result)


def call_openrouter(prompt):
    key = os.getenv("OPENROUTER_API_KEY")

    if not key:
        return "OpenRouter API key missing."

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "openrouter/free",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0
    }

    response = requests.post(
        url,
        headers=headers,
        json=data,
        timeout=120
    )

    if response.status_code != 200:
        return f"OpenRouter error {response.status_code}: {response.text}"

    result = response.json()

    try:
        return result["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(result)


def main():

    files = collect_project()

    if not files:
        print("No supported project files found.")
        sys.exit(1)

    print(f"Found {len(files)} project files.")

    prompt = build_prompt(files)

    results = {}
    failed = False

    print("\n==============================")
    print("GEMINI AUDIT")
    print("==============================")

    try:
        results["Gemini"] = call_gemini(prompt)
        print(results["Gemini"])
    except Exception as e:
        results["Gemini"] = f"ERROR: {e}"

    print("\n==============================")
    print("GROQ AUDIT")
    print("==============================")

    try:
        results["Groq"] = call_groq(prompt)
        print(results["Groq"])
    except Exception as e:
        results["Groq"] = f"ERROR: {e}"

    print("\n==============================")
    print("OPENROUTER AUDIT")
    print("==============================")

    try:
        results["OpenRouter"] = call_openrouter(prompt)
        print(results["OpenRouter"])
    except Exception as e:
        results["OpenRouter"] = f"ERROR: {e}"

    for provider, result in results.items():

        text = result.upper()

        if "STATUS: FAILED" in text:
            failed = True

        if text.startswith("ERROR"):
            failed = True

        if "API KEY MISSING" in text:
            failed = True

    print("\n==============================")
    print("FINAL AUDIT RESULT")
    print("==============================")

    if failed:
        print("STATUS: FAILED")
        sys.exit(1)

    print("STATUS: PASS")


if __name__ == "__main__":
    main()
