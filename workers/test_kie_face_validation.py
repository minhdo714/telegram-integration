
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

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
    except Exception as e:
        print(f"Error: {e}")

# Test with clearly invalid values to see if API complains
variations = [
    ("face_image_url = 'INVALID'", {
        "prompt": "test",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "face_image_url": "INVALID_STRING_NOT_URL_OR_BASE64"
    }),
    ("face_image = 'INVALID'", {
        "prompt": "test",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "face_image": "INVALID_STRING_NOT_URL_OR_BASE64"
    }),
     ("ref_images = ['INVALID']", {
        "prompt": "test",
        "aspect_ratio": "1:1",
        "quality": "basic",
        "ref_images": ["INVALID"]
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
