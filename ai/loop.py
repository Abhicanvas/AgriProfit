from groq import Groq
import os

print("AI loop started ✅")

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY not found")

client = Groq(api_key=api_key)

response = client.chat.completions.create(
    model="llama3-70b-8192",
    messages=[
        {"role": "user", "content": "Say exactly: Groq works perfectly in GitHub Actions"}
    ],
    temperature=0
)

print("Groq response:")
print(response.choices[0].message.content)
