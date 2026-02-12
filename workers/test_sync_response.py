import os
import sys
import requests
import json
from dotenv import load_dotenv
from PIL import Image

sys.path.append(os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

API_KEY = os.getenv('KIE_API_KEY')
BASE_URL = "https://api.kie.ai/api/v1"

# Create test image
img = Image.new('RGB', (256, 256), color='red')
test_path = 'test_sync_check.jpg'
img.save(test_path)

print("="*70)
print("TESTING SEEDREAM 4.5 EDIT - CHECKING FOR SYNCHRONOUS RESPONSE")
print("="*70)

# Upload image (using correct endpoint from kie_client.py)
print("\n1. Uploading test image...")
upload_url = "https://kieai.redpandaai.co/api/file-base64-upload"
headers = {"Authorization": f"Bearer {API_KEY}"}

import base64
import mimetypes

with open(test_path, 'rb') as image_file:
    base64_data = base64.b64encode(image_file.read()).decode('utf-8')

mime_type = 'image/jpeg'
payload = {
    "base64Data": f"data:{mime_type};base64,{base64_data}",
    "fileName": os.path.basename(test_path),
    "uploadPath": "telegram_bot_uploads"
}

upload_response = requests.post(upload_url, headers=headers, json=payload)
    
print(f"Upload Status: {upload_response.status_code}")
upload_data = upload_response.json().get('data', {})
face_url = upload_data.get('downloadUrl') or upload_data.get('url')
print(f"Face URL: {face_url}")

# Create edit task
print("\n2. Creating edit task...")
task_url = f"{BASE_URL}/jobs/createTask"
payload = {
    "model": "seedream/4.5-edit",
    "input": {
        "prompt": "Beautiful woman in red dress",
        "image_urls": [face_url],
        "aspect_ratio": "1:1",
        "quality": "basic"
    }
}

print(f"Payload: {json.dumps(payload, indent=2)}")

task_response = requests.post(task_url, headers=headers, json=payload)
print(f"\nTask Creation Status: {task_response.status_code}")
print(f"\nFULL TASK CREATION RESPONSE:")
print("="*70)
print(json.dumps(task_response.json(), indent=2))
print("="*70)

# Check if response contains direct results
response_json = task_response.json()
data = response_json.get('data', {})

print("\n3. Analyzing response structure...")
print(f"Response keys: {list(response_json.keys())}")
print(f"Data keys: {list(data.keys())}")

if 'results' in data:
    print(f"\n✓ FOUND 'results' in response!")
    print(f"Results: {data['results']}")
elif 'url' in data:
    print(f"\n✓ FOUND 'url' in response!")
    print(f"URL: {data['url']}")
elif 'taskId' in data or 'task_id' in data:
    task_id = data.get('taskId') or data.get('task_id')
    print(f"\n→ Only got task ID: {task_id}")
    print("→ This model requires async polling (which returns 404)")
else:
    print("\n✗ No obvious result field found")

# Cleanup
os.remove(test_path)
