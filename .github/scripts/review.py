import os
import glob
import requests
import sys

ROOT = "projects"

EXTENSIONS = (
    ".html", ".css", ".js", ".jsx", ".ts", ".tsx",
    ".json", ".py", ".php", ".java", ".kt"
)

def load_projects():
    projects = {}

    if not os.path.exists(ROOT):
        return projects

    for project in os.listdir(ROOT):
        path = os.path.join(ROOT, project)

        if not os.path.isdir(path):
            continue

        files = []

        for file in glob.glob(path + "/**/*", recursive=True):
            if os.path.isfile(file) and file.endswith(EXTENSIONS):
                try:
                    with open(file, "r", encoding="utf-8") as f:
                        files.append(
                            f"\n--- FILE: {file} ---\n{f.read()}"
                        )
                except Exception:
                    pass

        if files:
            projects[project] = "\n".join(files)

    return projects


def ask_gemini(prompt):
    key = os.getenv("GEMINI_API_KEY")

    if not key:
        return None

    url = (
        "https://generativelanguage.googleapis.com/"
        "v1beta/models/gemini-2.5-flash:generateContent"
    )

    response = requests.post(
        url,
        params={"key": key},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ]
        },
        timeout=120
    )

    return response.text


def ask_groq(prompt):
    key = os.getenv("GROQ_API_KEY")

    if not key:
        return None

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openai/gpt-oss-120b",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        },
        timeout=120
    )

    return response.text


def ask_openrouter(prompt):
    key = os.getenv("OPENROUTER_API_KEY")

    if not key:
        return None

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "openrouter/free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        },
        timeout=120
    )

    return response.text


projects = load_projects()

if not projects:
    print("ERROR: No project found inside projects/")
    sys.exit(1)

failed = False

for project_name, code in projects.items():

    print("\n================================")
    print("AUDITING:", project_name)
    print("================================")

    prompt = f"""
You are a senior software auditor and security reviewer.

Analyze the project carefully.

Check:

1. Syntax errors
2. Runtime errors
3. Logic bugs
4. Broken imports
5. Broken links
6. API problems
7. Firebase problems
8. Authentication/security problems
9. Hardcoded secrets
10. XSS
11. Injection vulnerabilities
12. Unsafe dependencies
13. Mobile responsiveness
14. Deployment problems
15. Performance problems
16. Obvious malicious code or suspicious behavior

Do NOT invent problems.

Return:

STATUS: PASS

or

STATUS: FAILED

For every real problem provide:
FILE
PROBLEM
SEVERITY
RECOMMENDED FIX

Project:

{code}
"""

    responses = []

    for name, func in [
        ("GEMINI", ask_gemini),
        ("GROQ", ask_groq),
        ("OPENROUTER", ask_openrouter)
    ]:
        try:
            result = func(prompt)

            if result:
                responses.append(
                    f"\n===== {name} =====\n{result}"
                )

        except Exception as e:
            print(f"{name} ERROR:", e)

    if not responses:
        print("ERROR: No AI provider available.")
        failed = True
        continue

    report = "\n".join(responses)

    print(report)

    if "STATUS: FAILED" in report:
        failed = True

if failed:
    print("\nAI AUDIT RESULT: FAILED")
    sys.exit(1)

print("\nAI AUDIT RESULT: PASSED")
