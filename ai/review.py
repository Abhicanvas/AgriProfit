from groq import Groq
import os, json
from pathlib import Path

client = Groq(api_key=os.environ["GROQ_API_KEY"])

files = []

for path in Path(".").rglob("*"):
    if (
        path.suffix in [".py", ".js", ".ts"]
        and ".github" not in str(path)
        and "ai/" not in str(path)
    ):
        try:
            files.append(f"\nFILE: {path}\n{path.read_text()}")
        except:
            pass

prompt = f"""
You are a senior engineer doing a STRICT code review.

RULES:
- DO NOT rewrite code
- DO NOT provide code snippets
- ONLY identify gaps

Find:
- missing validations
- logic errors
- missing edge cases
- security issues

Return STRICT JSON ONLY:

{{
  "gaps": [
    {{
      "file": "path",
      "line": number,
      "severity": "critical|major|minor",
      "message": "what is missing or wrong"
    }}
  ]
}}

Code:
{''.join(files)}
"""

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": prompt}],
    temperature=0
)

with open("gaps.json", "w") as f:
    f.write(response.choices[0].message.content)
