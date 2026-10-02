import os
import requests

CODE_EXTENSIONS = (".html", ".css", ".js", ".json", ".py")

def read_project():
    content = ""
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d != ".git" and d != ".github"]
        for file in files:
            if file.endswith(CODE_EXTENSIONS):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content += f"\n\n--- FILE: {path} ---\n{f.read()}"
                except:
                    pass
    return content

code = read_project()

if not code.strip():
    print("STATUS: FAILED")
    print("No project code found.")
    exit(1)

prompt = f"""
You are an expert software code auditor.

Check this project for:
1. Syntax errors
2. Runtime bugs
3. Broken imports
4. Broken links
5. HTML/CSS/JS problems
6. Security problems
7. Mobile responsiveness
8. Firebase/API mistakes
9. Deployment problems

If problems exist:
STATUS: FAILED
List exact file and problem with a fix.

If everything is ready:
STATUS: PASSED
Do not claim 100% unless you actually checked the code.

PROJECT:
{code}
"""

results = []

# GEMINI
if os.getenv("GEMINI_API_KEY"):
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent"
        r = requests.post(
            url,
            params={"key": os.getenv("GEMINI_API_KEY")},
            json={"contents":[{"parts":[{"text":prompt}]}]},
            timeout=120
        )
        results.append("GEMINI:\n" + str(r.json()))
    except Exception as e:
        results.append("GEMINI ERROR: " + str(e))

# GROQ
if os.getenv("GROQ_API_KEY"):
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": "Bearer " + os.getenv("GROQ_API_KEY"),
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-oss-120b",
                "messages":[{"role":"user","content":prompt}]
            },
            timeout=120
        )
        results.append("GROQ:\n" + str(r.json()))
    except Exception as e:
        results.append("GROQ ERROR: " + str(e))

# OPENROUTER
if os.getenv("OPENROUTER_API_KEY"):
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer " + os.getenv("OPENROUTER_API_KEY"),
                "Content-Type": "application/json"
            },
            json={
                "model": "openrouter/free",
                "messages":[{"role":"user","content":prompt}]
            },
            timeout=120
        )
        results.append("OPENROUTER:\n" + str(r.json()))
    except Exception as e:
        results.append("OPENROUTER ERROR: " + str(e))

print("\n".join(results))

if not results:
    print("STATUS: FAILED - No AI API configured")
    exit(1)

print("\nAI AUDIT COMPLETED")
