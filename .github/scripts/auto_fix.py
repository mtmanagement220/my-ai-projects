import os
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
}


def collect_files():

    files = []

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
            print(f"Read error: {path} - {e}")

    return files


def ask_ai(files):

    key = os.getenv("GEMINI_API_KEY")

    if not key:
        print("GEMINI_API_KEY is missing.")
        return None

    project = ""

    for file in files:
        project += f"""
FILE: {file["path"]}

{file["content"]}

========================
"""

    prompt = f"""
You are an expert software repair AI.

Repair ONLY real problems in this project.

Rules:

1. Do not redesign the project.
2. Do not remove working features.
3. Do not change the visual design unnecessarily.
4. Do not modify .github files.
5. Only modify files inside projects/.
6. Do not create malicious code.
7. Do not add tracking.
8. Do not expose API keys.
9. Preserve existing functionality.
10. Fix syntax/runtime/logic/import/link/dependency problems.
11. Keep mobile responsiveness.
12. Make the smallest safe changes.

Return ONLY valid JSON.

Format:

{{
  "changes": [
    {{
      "path": "projects/project1/index.html",
      "content": "FULL FILE CONTENT HERE"
    }}
  ]
}}

If no safe fix is possible:

{{
  "changes": []
}}

PROJECT:

{project}
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        "gemini-2.5-flash:generateContent"
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

    response = requests.post(
        url,
        json=payload,
        timeout=180
    )

    if response.status_code != 200:
        print(response.text)
        return None

    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


def clean_json(text):

    if not text:
        return None

    text = text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    try:
        return json.loads(text)
    except Exception as e:
        print("Could not parse AI JSON:", e)
        print(text)
        return None


def apply_changes(data):

    if not data:
        return False

    changes = data.get("changes", [])

    if not changes:
        print("AI did not find a safe automatic fix.")
        return False

    changed = False

    for item in changes:

        path = item.get("path")
        content = item.get("content")

        if not path or content is None:
            continue

        target = Path(path)

        # SECURITY: only projects/
        try:
            target.resolve().relative_to(
                PROJECT_ROOT.resolve()
            )
        except ValueError:
            print("Blocked unsafe path:", path)
            continue

        target.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        target.write_text(
            content,
            encoding="utf-8"
        )

        print("FIXED:", path)

        changed = True

    return changed


def main():

    print("================================")
    print("AI AUTO FIX ENGINE")
    print("================================")

    files = collect_files()

    if not files:
        print("No project files found.")
        return

    print(f"Files available for repair: {len(files)}")

    result = ask_ai(files)

    data = clean_json(result)

    if apply_changes(data):
        print("Automatic fixes applied.")
    else:
        print("No automatic changes were applied.")


if __name__ == "__main__":
    main()
