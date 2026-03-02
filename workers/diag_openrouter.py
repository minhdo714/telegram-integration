
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def diagnose():
    api_key = os.getenv('OPENROUTER_API_KEY')
    print(f"Using API Key: {api_key[:10]}...{api_key[-5:]}")
    
    # 1. Check Key Info
    print("\n--- KEY INFO ---")
    r = requests.get('https://openrouter.ai/api/v1/auth/key', headers={'Authorization': f'Bearer {api_key}'})
    if r.status_code == 200:
        data = r.json().get('data', {})
        usage = data.get('usage', 0)
        limit = data.get('limit', 'UNSET')
        print(f"Usage: {usage}")
        print(f"Limit: {limit}")
        if isinstance(limit, (int, float)):
            print(f"Available: {limit - usage}")
    else:
        print(f"Failed to get key info: {r.status_code} - {r.text}")

    # 2. Test Model
    model = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
    print(f"\n--- TESTING MODEL: {model} ---")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://telegram-integration.local",
        "X-Title": "Telegram Integration Bot"
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
        if r.status_code == 200:
            print(f"SUCCESS! Response: {r.json()['choices'][0]['message']['content']}")
    except Exception as e:
        print(f"Error during request: {e}")

if __name__ == '__main__':
    diagnose()
