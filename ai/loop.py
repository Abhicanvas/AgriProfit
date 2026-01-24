from openai import OpenAI
import os

print("AI loop started ✅")

# Load API key
api_key = os.environ.get("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY not found")

client = OpenAI(api_key=api_key)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {"role": "user", "content": "Say: GitHub Actions can talk to ChatGPT"}
    ],
)

print("ChatGPT response:")
print(response.choices[0].message.content)
