
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# 1x1 red dot JPEG base64
# (approximate, since jpeg doesn't support 1x1 well sometimes, using a small valid jpeg)
base64_jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

def try_payload(name, input_data):
    url = f"{base_url}/jobs/createTask"
    payload = {
        "model": "seedream/4.5-edit",
        "input": input_data
    }
    print(f"\nTesting {name}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

variations = [
    ("With image_urls (JPEG Data URI)", {
        "prompt": "Change to blue",
        "image_urls": [base64_jpeg]
    }),
    ("With image_urls (Public HTTP URL)", {
        "prompt": "Change to blue",
        "image_urls": ["https://via.placeholder.com/150.jpg"]
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
