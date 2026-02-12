
import os
import requests
import base64
import json
import time
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Create a small dummy image
dummy_path = "dummy_test_image.jpg"
with open(dummy_path, "wb") as f:
    f.write(base64.b64decode("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="))

def upload_image(file_path):
    url = "https://kieai.redpandaai.co/api/file-base64-upload"
    with open(file_path, "rb") as image_file:
         base64_data = base64.b64encode(image_file.read()).decode('utf-8')
    
    payload = {
        "base64Data": f"data:image/jpeg;base64,{base64_data}",
        "fileName": os.path.basename(file_path),
        "uploadPath": "test_uploads"
    }

    print(f"Uploading {file_path}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.ok:
            data = response.json().get('data', {})
            # Try to get URL first, then filePath
            res_url = data.get('url') or data.get('filePath')
            print(f"Upload Success: {res_url}")
            return res_url
        else:
            print(f"Upload Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Upload Error: {e}")
        return None

def test_edit(image_ref):
    url = f"{base_url}/jobs/createTask"
    
    print(f"\nTesting Edit with ref: {image_ref}")
    
    payload = {
        "model": "seedream/4.5-edit",
        "input": {
            "prompt": "Change to blue",
            "image_urls": [image_ref]
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# Run
uploaded_url = upload_image(dummy_path)
if uploaded_url:
    test_edit(uploaded_url)

# Cleanup
if os.path.exists(dummy_path):
    os.remove(dummy_path)
