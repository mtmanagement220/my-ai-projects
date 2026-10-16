#!/usr/bin/env python3
"""Safe, dependency-light checks for common project file types."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path("projects")
IGNORED = {".git", "node_modules", "dist", "build", ".next", "__pycache__", "vendor"}
ERRORS = []
CHECKED = 0

def files():
    if not ROOT.exists():
        return []
    return [p for p in ROOT.rglob("*") if p.is_file() and not any(part in IGNORED for part in p.parts)]

def main():
    global CHECKED
    all_files = files()
    if not all_files:
        print("ERROR: projects/ contains no files to check.")
        return 1

    js_files = []
    for path in all_files:
        suffix = path.suffix.lower()
        if path.stat().st_size > 2_000_000:
            print(f"SKIP large file (>2 MB): {path}")
            continue
        CHECKED += 1
        if suffix == ".json":
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except Exception as exc:
                ERRORS.append(f"{path}: invalid JSON: {exc}")
        elif suffix == ".py":
            try:
                compile(path.read_text(encoding="utf-8"), str(path), "exec")
            except Exception as exc:
                ERRORS.append(f"{path}: Python syntax error: {exc}")
        elif suffix in {".js", ".mjs", ".cjs"}:
            js_files.append(path)

    for path in js_files:
        result = subprocess.run(["node", "--check", str(path)], text=True, capture_output=True)
        if result.returncode:
            detail = (result.stderr or result.stdout).strip()
            ERRORS.append(f"{path}: JavaScript syntax error: {detail[:1200]}")

    print(f"Checked {CHECKED} project files; JavaScript syntax checks: {len(js_files)}.")
    if ERRORS:
        print("STATUS: FAILED")
        for error in ERRORS:
            print(f"- {error}")
        return 1
    print("STATUS: PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
