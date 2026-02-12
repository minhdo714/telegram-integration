
import os
import sys
import logging

# Add workers to path
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from kie_client import KieClient

# Setup logging
logging.basicConfig(level=logging.INFO)

def test_with_real_face():
    """Test KieClient.generate_image() with ACTUAL model face reference"""
    print("\n" + "="*60)
    print("TESTING SEEDREAM 4.5 EDIT WITH REAL MODEL FACE REFERENCE")
    print("="*60 + "\n")
    
    # Use actual uploaded face reference from account 6
    face_path = os.path.join(
        os.path.dirname(__file__), 
        'uploads/6/face/1770193201_70814268_10157562094132232_7102940665570394112_n.jpg'
    )
    
    if not os.path.exists(face_path):
        print(f"ERROR: Face reference not found at {face_path}")
        return
    
    print(f"Using REAL model face reference:")
    print(f"  Path: {face_path}")
    print(f"  Exists: {os.path.exists(face_path)}")
    print(f"  Size: {os.path.getsize(face_path)} bytes\n")
    
    # Initialize client
    client = KieClient()
    print(f"KieClient initialized. API Key present: {bool(client.api_key)}\n")
    
    # Test prompt
    prompt = "Beautiful woman in red lingerie, professional studio photo, high quality"
    
    print(f"Calling generate_image() with:")
    print(f"  Prompt: {prompt}")
    print(f"  Face Ref: REAL MODEL FACE (from uploads)")
    print(f"\nThis will:")
    print(f"  1. Upload the REAL face reference to Kie.ai")
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
        print(f"\nYou can view the generated image at:")
        print(f"{result['url']}")
    elif result.get('error'):
        print(f"\n✗ FAILED: {result['error']}")
    
    return result

if __name__ == "__main__":
    test_with_real_face()
