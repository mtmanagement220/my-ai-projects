import os﻿
import sys﻿
import glob﻿
import requests﻿

gemini_key = os.getenv("GEMINI_API_KEY")﻿

code_content = ""﻿
for file_path in glob.glob("**/*", recursive=True):﻿
    if file_path.endswith(('.html', '.css', '.js', '.json')) and not file_path.startswith('.github'):﻿
        try:﻿
            with open(file_path, 'r', encoding='utf-8') as f:﻿
                code_content += f"\n--- File: {file_path} ---\n" + f.read()﻿
        except Exception:﻿
            pass﻿

if not code_content.strip():﻿
    print("No code files found.")﻿
    sys.exit(0)﻿

prompt = f"""﻿
You are a Code Quality Auditor. Review line-by-line:﻿
1. Syntax errors, broken links, logical bugs.﻿
2. Responsiveness and UI bugs.﻿

Code:﻿
{code_content}﻿

Strict Output Rules:﻿
- If ANY issue exists, start with "STATUS: FAILED" and list exact file, line number, issue, and fixed code.﻿
- If 100% bug-free, respond ONLY with "STATUS: PASSED - 100% Verified".﻿
"""﻿

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"﻿
headers = {'Content-Type': 'application/json'}﻿
payload = {"contents": [{"parts": [{"text": prompt}]}]}﻿

try:﻿
    res = requests.post(url, json=payload, headers=headers).json()﻿
    output = res['candidates'][0]['content']['parts'][0]['text']﻿

    print("\n--- AI CODE REVIEW REPORT ---")﻿
    print(output)﻿
    print("-----------------------------\n")﻿

    if "STATUS: PASSED" in output:﻿
        print("✅ Code 100% Passed!")﻿
        sys.exit(0)﻿
    else:﻿
        print("❌ Code Failed.")﻿
        sys.exit(1)﻿
except Exception as e:﻿
    print(f"Error: {e}")﻿
    sys.exit(1)
