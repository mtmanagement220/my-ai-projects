#!/usr/bin/env python3
"""Generic, dependency-light checks for projects uploaded at repository root or in subfolders."""
import json
import subprocess
from pathlib import Path

ROOT = Path(".")
IGNORED = {
    ".git", ".github", "node_modules", "dist", "build", ".next",
    "__pycache__", "vendor", ".venv", "venv", "coverage",
    ".dart_tool", "Pods", "target", "bin", "obj"
}
ERRORS = []
CHECKED = 0
DETECTED = set()


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
    return [
        p for p in ROOT.rglob("*")
        if p.is_file()
        and not any(part in IGNORED for part in p.parts)
        and p.name not in {".env", ".env.local", ".env.production", "secrets.json"}
    ]


def main():
    global CHECKED
    all_files = files()
    project_files = [
        p for p in all_files
        if p.suffix.lower() in PROJECT_SUFFIXES or p.name.lower() in PROJECT_FILENAMES
    ]
    if not project_files:
        print("STATUS: PASSED")
        print("SETUP MODE: No project files uploaded yet; project checks are safely skipped.")
        return 0

    js_files = []
    for path in project_files:
        rel = path.as_posix()
        name = path.name.lower()
        suffix = path.suffix.lower()
        if name == "package.json":
            DETECTED.add("Node.js / JavaScript project (package.json)")
        if name in {"requirements.txt", "pyproject.toml", "setup.py"}:
            DETECTED.add("Python project")
        if name == "pubspec.yaml":
            DETECTED.add("Flutter / Dart project")
        if name == "composer.json":
            DETECTED.add("PHP / Composer project")
        if name == "pom.xml":
            DETECTED.add("Java / Maven project")
        if name in {"build.gradle", "build.gradle.kts"}:
            DETECTED.add("Gradle / Android / JVM project")
        if name == "cargo.toml":
            DETECTED.add("Rust project")
        if name == "go.mod":
            DETECTED.add("Go project")
        if name == "dockerfile":
            DETECTED.add("Docker-based project")

        try:
            if path.stat().st_size > 2_000_000:
                print(f"NOTICE: skipped large file (>2 MB): {rel}")
                continue
        except OSError:
            continue
        CHECKED += 1
        if suffix == ".json":
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except Exception as exc:
                ERRORS.append(f"{rel}: invalid JSON: {exc}")
        elif suffix == ".py":
            try:
                compile(path.read_text(encoding="utf-8"), rel, "exec")
            except Exception as exc:
                ERRORS.append(f"{rel}: Python syntax error: {exc}")
        elif suffix in {".js", ".mjs", ".cjs"}:
            js_files.append(path)

    for path in js_files:
        result = subprocess.run(
            ["node", "--check", str(path)],
            text=True, capture_output=True, timeout=30
        )
        if result.returncode:
            detail = (result.stderr or result.stdout).strip()
            ERRORS.append(f"{path.as_posix()}: JavaScript syntax error: {detail[:1000]}")

    print(f"Files checked: {CHECKED}")
    print("Detected project types:")
    if DETECTED:
        for item in sorted(DETECTED):
            print(f"- {item}")
    else:
        print("- Type not confidently identified; generic file checks only.")
    print("Supported automatic checks: JSON syntax, Python syntax, JavaScript syntax.")
    print("Framework-specific build/test commands are not assumed or run automatically.")
    if ERRORS:
        print("STATUS: FAILED")
        for error in ERRORS:
            print(f"- {error}")
        return 1
    print("STATUS: PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
