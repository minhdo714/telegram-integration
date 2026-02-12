
import os
import sys
import logging
from PIL import Image
import io
from dotenv import load_dotenv

# Load env variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Add workers directory to path so we can import kie_client
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from kie_client import KieClient

# Setup basic logging
logging.basicConfig(level=logging.INFO)

def create_dummy_image(filename="test_ref.jpg"):
    img = Image.new('RGB', (512, 512), color = 'red')
    img.save(filename)
    return filename

def test_strict_mode():
    client = KieClient()
    print("\n--- Test 1: No Reference Image (Should Fail) ---")
    result = client.generate_image("Make it blue")
    print(f"Result: {result}")
    
    if result.get('error') == "Reference image required for Seedream 4.5 Edit":
        print("PASS: Correctly rejected missing reference.")
    else:
        print("FAIL: Did not receive expected error for missing reference.")

    print("\n--- Test 2: With Reference Image (Should Attempt Edit) ---")
    dummy_path = create_dummy_image()
    
    try:
        # We expect this might fail at the API level (500) if the payload is still wrong,
        # BUT we want to ensure it *tried* the edit and didn't fallback to text-to-image.
        # The logs will show "Attempting Seedream 4.5 Edit generation..."
        result = client.generate_image("Make it blue", face_ref_path=dummy_path)
        print(f"Result: {result}")
        
    finally:
        if os.path.exists(dummy_path):
            os.remove(dummy_path)

if __name__ == "__main__":
    test_strict_mode()
