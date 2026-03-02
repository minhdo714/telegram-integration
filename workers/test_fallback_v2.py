import os
import sys
import logging
from dotenv import load_dotenv

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))
sys.path.append(os.path.dirname(__file__))

from text_gen_client import TextGenClient

# Configure logging to see the fallback process
logging.basicConfig(level=logging.INFO)

def test_fallback():
    print("Testing AI Provider Fallback...")
    
    # Ensure xai is the primary provider (known to be exhausted/failing)
    os.environ['TEXT_GEN_PROVIDER'] = 'xai'
    
    client = TextGenClient()
    
    if client.mode == 'mock':
        print("FAILURE: Client in mock mode. Check API keys.")
        return

    print(f"Initial Priority: {client.available_providers}")
    
    history = [{'role': 'user', 'content': 'Tell me a short joke about robots.'}]
    system_prompt = "You are a flirty AI."

    print("\nSending request (should fail on xAI and fallback to OpenRouter)...")
    try:
        response = client.generate_reply(history, system_prompt)
        print(f"\nFinal Response: {response}")
        
        # Check if fallback happened (we'd see it in logs, but we can also infer if response comes back)
        if "bit slow today" not in response:
            print("\nSUCCESS: Fallback logic seems to have worked!")
        else:
            print("\nFAILURE: Returned fallback message instead of actual reply.")
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_fallback()
