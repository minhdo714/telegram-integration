import os
import sys
from dotenv import load_dotenv

# Load .env from root directory (parent of workers)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

# Ensure we can import modules from verify current directory
sys.path.append(os.path.dirname(__file__))

from text_gen_client import TextGenClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_openrouter():
    print("Testing OpenRouter Integration...")
    
    # Force provider to OpenRouter for this test
    os.environ['TEXT_GEN_PROVIDER'] = 'openrouter'
    
    # Check for API Key
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("ERROR: OPENROUTER_API_KEY not found in environment.")
        print("Please add it to workers/.env")
        return

    client = TextGenClient()
    
    if client.mode == 'mock':
        print("Client initialized in MOCK mode. Check your configuration.")
        return

    print(f"Client initialized in {client.mode.upper()} mode with model: {client.model}")
    
    # Override model for testing connectivity if needed
    # client.model = "google/gemma-2-9b-it:free" 
    # Uncomment above line to test if another model works
    
    history = [
        {'role': 'user', 'content': 'Hello! Who are you?'}
    ]
    system_prompt = "You are a helpful AI assistant."
    
    print("\nSending request...")
    try:
        response = client.generate_reply(history, system_prompt)
        print(f"\nResponse from AI:\n{response}")
        print("\nSUCCESS: OpenRouter integration working.")
    except Exception as e:
        print(f"\nFAILURE DETAILS: {e}")
        # also print .response if exists
        if hasattr(e, 'response'):
             print(f"Response Body: {e.response}")

if __name__ == "__main__":
    test_openrouter()
