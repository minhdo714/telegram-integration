
import os
import sys
import logging
from dotenv import load_dotenv

# Setup logging to stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

# Load env
load_dotenv()

# Add workers to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from workers.kie_client import KieClient

API_KEY = os.getenv('KIE_API_KEY')
print(f"API Key present: {bool(API_KEY)}")

client = KieClient()
# Override logger to print to stdout
client.logger = logging.getLogger('kie_test')
client.logger.setLevel(logging.INFO)
client.logger.addHandler(logging.StreamHandler(sys.stdout))

# Path to face image
face_path = os.path.join("workers", "uploads", "9", "face", "1770724709_a0f6ce20-edfe-43d5-904a-bef5d48ab99d_0.jpg")
if not os.path.exists(face_path):
    # Try alternate path if relative path fails
    face_path = os.path.join(os.getcwd(), "workers", "uploads", "9", "face", "1770724709_a0f6ce20-edfe-43d5-904a-bef5d48ab99d_0.jpg")

print(f"Testing with face path: {face_path}")
print(f"File exists: {os.path.exists(face_path)}")

prompt = "A beautiful selfie of a woman in a cafe, smiling"

print("Starting generation...")
result = client.generate_image(prompt, face_ref_path=face_path)
print("RESULT:", result)
