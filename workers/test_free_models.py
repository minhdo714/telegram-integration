
import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

def test_models():
    api_key = os.getenv('OPENROUTER_API_KEY')
    models = [
        "google/gemma-2-9b-it:free",
        "mistralai/mistral-7b-instruct:free",
        "meta-llama/llama-3-8b-instruct:free",
        "huggingfaceh4/zephyr-7b-beta:free"
    ]
    
    for model in models:
        print(f"\nTesting {model}...")
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
            if r.status_code == 200:
                print(f"SUCCESS! {model} works.")
                print(f"Response: {r.json()['choices'][0]['message']['content']}")
                return model # Return first working model
            else:
                print(f"FAILED {model}: {r.status_code} - {r.text}")
        except Exception as e:
            print(f"ERROR testing {model}: {e}")
    
    return None

if __name__ == "__main__":
    test_models()
