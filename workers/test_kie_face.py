
import os
import requests
import base64
import time
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
print(f"KIE_API_KEY found: {'Yes' if api_key else 'No'}")
headers = {"Authorization": f"Bearer {api_key}"}
base_url = "https://api.kie.ai/api/v1"

# Create a tiny 1x1 red pixel image for testing base64
# This logic assumes the API just checks valid base64, 
# even if the result is garbage it should return a task ID.
# Realistically we need a verifiable face for the final result, 
# but for payload validation, any valid image structure works.
# 1x1 red dot png
base64_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def try_payload(name, input_data):
    url = f"{base_url}/jobs/createTask"
    payload = {
        "model": "seedream/4.5-text-to-image", 
        "input": input_data
    }
    print(f"\nTesting {name}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.ok:
            return response.json().get('data', {}).get('taskId')
    except Exception as e:
        print(f"Error: {e}")

variations = [
    ("face_image_url (Base64)", {
        "prompt": "A beautiful model",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "face_image_url": base64_img
    }),
    ("image_urls (List Base64)", {
        "prompt": "A beautiful model",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "image_urls": [base64_img]
    }),
    ("images (List Base64)", {
        "prompt": "A beautiful model",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "images": [base64_img]
    }),
    ("ref_images (List Base64)", {
        "prompt": "A beautiful model", 
        "aspect_ratio": "1:1",
        "quality": "basic",
        "ref_images": [base64_img]
    }),
    ("face_image (Base64)", {
        "prompt": "A beautiful model",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "face_image": base64_img
    })
]

for name, input_data in variations:
    res = try_payload(name, input_data)
    if res:
        print(f"SUCCESS Task ID: {res}")
        break
