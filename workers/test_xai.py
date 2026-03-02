
import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def test_xai():
    api_key = os.getenv('XAI_API_KEY')
    model = os.getenv('XAI_MODEL', 'grok-4-1-fast-reasoning')
    print(f"Testing xAI with model {model} and key {api_key[:10]}...")
    
    url = "https://api.x.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10
    }
    try:
        r = requests.post(url, headers=headers, json=data)
        print(f"Status: {r.status_code}")
        print(f"Body: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_xai()
