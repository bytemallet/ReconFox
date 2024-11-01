from openai import OpenAI
from reconfox.reconfox_config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def callGPT(prompt):
    # Request the completion from OpenAI
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=50,
        temperature=0.5
    )
    print(response)
    return response.choices[0].message.content.strip()
