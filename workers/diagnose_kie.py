import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from kie_client import KieClient
from PIL import Image

# Create a simple test image
img = Image.new('RGB', (256, 256), color='blue')
test_path = 'test_debug.jpg'
img.save(test_path)

print("Testing full Kie.ai workflow with detailed logging...\n")

client = KieClient()

# Test the workflow
prompt = "Beautiful woman in red dress"
result = client.generate_image(prompt, face_ref_path=test_path)

print("\n" + "="*60)
print("FINAL RESULT:")
print("="*60)
print(result)

# Cleanup
if os.path.exists(test_path):
    os.remove(test_path)

if result.get('url'):
    print("\n✓ SUCCESS - We have an image URL!")
    print(f"URL: {result['url']}")
else:
    print(f"\n✗ FAILED - Error: {result.get('error')}")
