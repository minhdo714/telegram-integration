
import os
import sys
from PIL import Image
import logging

# Add workers to path
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from kie_client import KieClient

# Setup logging
logging.basicConfig(level=logging.INFO)

def create_test_face_image():
    """Create a simple test face reference image"""
    # Create 512x512 red image as test face
    img = Image.new('RGB', (512, 512), color='red')
    test_path = os.path.join(os.path.dirname(__file__), 'test_face_ref.jpg')
    img.save(test_path)
    print(f"Created test face reference: {test_path}")
    return test_path

def test_generate_with_face():
    """Test KieClient.generate_image() with face reference"""
    print("\n" + "="*60)
    print("TESTING SEEDREAM 4.5 EDIT WITH FACE REFERENCE")
    print("="*60 + "\n")
    
    # Create test face
    face_path = create_test_face_image()
    
    # Initialize client
    client = KieClient()
    print(f"KieClient initialized. API Key present: {bool(client.api_key)}\n")
    
    # Test prompt
    prompt = "Beautiful woman in red lingerie, professional photo"
    
    print(f"Calling generate_image() with:")
    print(f"  Prompt: {prompt}")
    print(f"  Face Ref: {face_path}")
    print(f"\nThis will:")
    print(f"  1. Upload the face reference to Kie.ai")
    print(f"  2. Create a task with seedream/4.5-edit model")
    print(f"  3. Poll for completion (up to 180 seconds)")
    print("\nStarting...\n")
    
    result = client.generate_image(prompt, face_ref_path=face_path)
    
    print("\n" + "="*60)
    print("RESULT")
    print("="*60)
    print(result)
    
    if result.get('url'):
        print(f"\n✓ SUCCESS! Image URL: {result['url']}")
    elif result.get('error'):
        print(f"\n✗ FAILED: {result['error']}")
    
    # Cleanup
    if os.path.exists(face_path):
        os.remove(face_path)
        print(f"\nCleaned up test file: {face_path}")
    
    return result

if __name__ == "__main__":
    test_generate_with_face()
