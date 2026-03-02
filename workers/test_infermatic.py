
import os
import sys
from dotenv import load_dotenv

# Load .env from root directory (parent of workers)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

# Ensure we can import modules from current directory
sys.path.append(os.path.dirname(__file__))

from text_gen_client import TextGenClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_infermatic():
    print("Testing Infermatic.ai Integration...")
    
    # Check for API Key
    api_key = os.getenv('INFERMATIC_API_KEY')
    if not api_key:
        print("ERROR: INFERMATIC_API_KEY not found in .env.")
        return

    client = TextGenClient()
    
    # Ensure infermatic is available
    if 'infermatic' not in client.available_providers:
        print("ERROR: Infermatic provider NOT initialized. Check credentials.")
        return

    print(f"Client initialized with model: {client.clients['infermatic'][1]}")
    
    history = [
        {'role': 'user', 'content': 'Hello! Who are you?'}
    ]
    system_prompt = "You are a helpful AI assistant."
    
    print("\nSending request to Infermatic...")
    try:
        response = client.generate_reply(history, system_prompt, model=os.getenv('INFERMATIC_MODEL'))
        print(f"\nResponse from AI:\n{response}")
        print("\nSUCCESS: Infermatic.ai integration working.")
    except Exception as e:
        print(f"\nFAILURE DETAILS: {e}")
        if hasattr(e, 'response'):
             print(f"Status Code: {e.response.status_code}")
             print(f"Response Body: {e.response.text}")

if __name__ == "__main__":
    test_infermatic()
