import os
import json
import requests
from pathlib import Path


PROJECT_ROOT = Path("projects")


def collect_project_files():
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
            ".next",
            "dist",
            "build"
        } for part in path.parts):
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


def call_gemini(project_files):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("ERROR: GEMINI_API_KEY missing")
        return None

    project_text = "\n\n".join(
        f"""
========== FILE: {item['path']} ==========

{item['content']}
"""
        for item in project_files
    )

    prompt = f"""
You are an expert autonomous software repair engineer.

You are repairing a real project inside the "projects/" directory.

Your job:

1. Inspect ALL provided project files.
2. Find programming errors.
3. Find broken HTML/CSS/JavaScript.
4. Find missing references.
5. Find obvious runtime problems.
6. Find syntax errors.
7. Find security problems that can be safely corrected.
8. Preserve the existing design and functionality.
9. Do NOT redesign the project unnecessarily.
10. Do NOT delete working features.
11. Make the smallest safe changes required.
12. Only modify files inside projects/.
13. Never create secrets or API keys.
14. Never modify GitHub workflow files.
15. Never modify files outside projects/.

Return ONLY valid JSON.

Required format:

{{
  "changes": [
    {{
      "path": "projects/project1/index.html",
      "content": "FULL corrected file content"
    }}
  ]
}}

If no repair is needed:

{{
  "changes": []
}}

PROJECT FILES:

{project_text}
"""

    url = (
        "https://generativelanguage.googleapis.com/"
        "v1beta/models/gemini-2.5-flash:generateContent"
        f"?key={api_key}"
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

    response = requests.post(
        url,
        json=payload,
        timeout=180
    )

    if response.status_code != 200:
        print("Gemini API error:", response.status_code)
        print(response.text[:3000])
        return None

    data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        print("Could not read Gemini response.")
        return None


def clean_json(text):
    if not text:
        return None

    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    return text


def apply_changes(result):
    result = clean_json(result)

    if not result:
        return False

    try:
        data = json.loads(result)
    except Exception as e:
        print("Invalid JSON returned by AI:")
        print(e)
        print(result[:5000])
        return False

    changes = data.get("changes", [])

    if not changes:
        print("AI found no safe changes.")
        return True

    changed = False

    for item in changes:
        path = item.get("path")
        content = item.get("content")

        if not path or content is None:
            continue

        target = Path(path)

        # Security boundary
        try:
            target.resolve().relative_to(
                PROJECT_ROOT.resolve()
            )
        except ValueError:
            print("BLOCKED unsafe path:", path)
            continue

        target.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        target.write_text(
            content,
            encoding="utf-8"
        )

        print("✅ Repaired:", path)
        changed = True

    return changed


def main():
    files = collect_project_files()

    if not files:
        print("No project files found.")
        return 1

    print(f"Found {len(files)} project files.")

    result = call_gemini(files)

    if result is None:
        return 1

    success = apply_changes(result)

    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
