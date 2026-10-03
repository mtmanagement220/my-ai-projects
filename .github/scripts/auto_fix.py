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
            print(f"Read error: {path} -> {e}")

    return files


def ask_gemini(files):

    key = os.getenv("GEMINI_API_KEY")

    if not key:
        print("GEMINI_API_KEY missing.")
        return None

    project = ""

    for item in files:
        project += f"""
FILE: {item["path"]}

{item["content"]}

========================
"""

    prompt = f"""
You are a professional software repair AI.

Find and repair real errors in this project.

IMPORTANT RULES:

1. Modify ONLY files inside projects/.
2. Never modify .github/.
3. Do not redesign the project.
4. Do not remove working features.
5. Do not add malicious code.
6. Do not add tracking.
7. Do not expose secrets.
8. Preserve the existing UI.
9. Make the smallest safe fixes.
10. Return COMPLETE file contents for files you change.

Return ONLY valid JSON:

{{
  "changes": [
    {{
      "path": "projects/project1/index.html",
      "content": "COMPLETE FILE CONTENT"
    }}
  ]
}}

If there is no safe fix:

{{
  "changes": []
}}

PROJECT:

{project}
"""

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
        timeout=180
    )

    if r.status_code != 200:
        print(r.text)
        return None

    data = r.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


def parse_json(text):

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
        print("JSON parsing failed:", e)
        return None


def apply_changes(data):

    if not data:
        return False

    changes = data.get("changes", [])

    if not changes:
        print("No safe automatic fix.")
        return False

    changed = False

    for item in changes:

        path = item.get("path")
        content = item.get("content")

        if not path or content is None:
            continue

        target = Path(path)

        # Security check:
        try:
            target.resolve().relative_to(
                PROJECT_ROOT.resolve()
            )
        except ValueError:
            print("BLOCKED:", path)
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
    print("AI AUTO-FIX ENGINE")
    print("================================")

    files = collect_files()

    if not files:
        print("No project files found.")
        return

    print(f"Project files: {len(files)}")

    ai_response = ask_gemini(files)

    data = parse_json(ai_response)

    if apply_changes(data):
        print("AI fixes applied successfully.")
    else:
        print("No changes applied.")


if __name__ == "__main__":
    main()
