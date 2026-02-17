
import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def test_grok():
    print("--- Grok Direct Test ---")
    api_key = os.getenv('XAI_API_KEY')
    model = os.getenv('XAI_MODEL', 'grok-4-1-fast-reasoning')
    
    print(f"Model: {model}")
    print(f"Key Present: {bool(api_key)}")
    
    if not api_key:
        print("FAIL: No API Key")
        return

    try:
        client = OpenAI(
            base_url="https://api.x.ai/v1",
            api_key=api_key
        )
        
        print("Sending request...")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello! Reply with 'Grok is ready' if you hear me."}
            ],
            temperature=0.7
        )
        print("\n--- RESPONSE ---")
        print(response.choices[0].message.content)
        print("--- END ---")
        
    except Exception as e:
        print(f"\n--- API ERROR ---")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_grok()
