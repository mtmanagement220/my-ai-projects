#!/usr/bin/env python3
"""Dependency-light syntax checks for each project under projects/."""
import json
import subprocess
from pathlib import Path

ROOT = Path("projects")
IGNORED = {
    ".git", ".github", "node_modules", "dist", "build", ".next",
    "__pycache__", "vendor", ".venv", "venv", "coverage",
    ".dart_tool", "Pods", "target", "bin", "obj"
}
EXCLUDED_NAMES = {".env", ".env.local", ".env.production", "secrets.json"}
PROJECT_SUFFIXES = {
    ".html", ".htm", ".css", ".scss", ".js", ".mjs", ".cjs", ".json",
    ".py", ".ts", ".tsx", ".jsx", ".vue", ".svelte", ".php", ".java",
    ".kt", ".kts", ".xml", ".yml", ".yaml", ".toml", ".sql", ".go",
    ".rs", ".rb", ".sh", ".swift", ".dart", ".gradle", ".properties",
    ".r", ".cs", ".cpp", ".c", ".h", ".hpp"
}
PROJECT_FILENAMES = {
    "dockerfile", "makefile", "go.mod", "cargo.toml", "pom.xml",
    "composer.json", "package.json", "pubspec.yaml", "requirements.txt",
    "pyproject.toml", "setup.py", "build.gradle", "build.gradle.kts"
}


def files():
    if not ROOT.exists():
        return []
    return [
        p for p in ROOT.rglob("*")
        if p.is_file()
        and not any(part in IGNORED for part in p.parts)
        and p.name.lower() not in EXCLUDED_NAMES
        and (p.suffix.lower() in PROJECT_SUFFIXES or p.name.lower() in PROJECT_FILENAMES)
    ]


def main():
    all_files = files()
    if not all_files:
        print("STATUS: FAILED")
        print("No supported project files found under projects/. Add each project to projects/<project-name>/.")
        return 1

    errors = []
    detected = set()
    checked = 0
    js_files = []
    for path in all_files:
        rel = path.as_posix()
        name = path.name.lower()
        suffix = path.suffix.lower()
        if name == "package.json":
            detected.add("Node.js / JavaScript")
        if name in {"requirements.txt", "pyproject.toml", "setup.py"}:
            detected.add("Python")
        if name == "pubspec.yaml":
            detected.add("Flutter / Dart")
        if name == "composer.json":
            detected.add("PHP / Composer")
        if name == "pom.xml":
            detected.add("Java / Maven")
        if name in {"build.gradle", "build.gradle.kts"}:
            detected.add("Gradle / Android / JVM")
        if name == "cargo.toml":
            detected.add("Rust")
        if name == "go.mod":
            detected.add("Go")
        if name == "dockerfile":
            detected.add("Docker")

        try:
            if path.stat().st_size > 2_000_000:
                print(f"NOTICE: skipped large file (>2 MB): {rel}")
                continue
            content = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(f"{rel}: could not read UTF-8 text: {exc}")
            continue
        checked += 1
        if suffix == ".json":
            try:
                json.loads(content)
            except Exception as exc:
                errors.append(f"{rel}: invalid JSON: {exc}")
        elif suffix == ".py":
            try:
                compile(content, rel, "exec")
            except Exception as exc:
                errors.append(f"{rel}: Python syntax error: {exc}")
        elif suffix in {".js", ".mjs", ".cjs"}:
            js_files.append(path)

    for path in js_files:
        try:
            result = subprocess.run(
                ["node", "--check", str(path)],
                text=True, capture_output=True, timeout=30
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            errors.append(f"{path.as_posix()}: Node syntax check could not run: {exc}")
            continue
        if result.returncode:
            detail = (result.stderr or result.stdout).strip()
            errors.append(f"{path.as_posix()}: JavaScript syntax error: {detail[:1000]}")

    print(f"Files checked: {checked}")
    print("Project folders: projects/<project-name>/")
    print("Detected project types: " + (", ".join(sorted(detected)) if detected else "not confidently identified"))
    print("Supported automatic checks: JSON syntax, Python syntax, JavaScript syntax.")
    print("NOTE: Framework builds, HTML/CSS quality, dependencies and runtime behavior need additional project-specific tests.")
    if errors:
        print("STATUS: FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("STATUS: PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
