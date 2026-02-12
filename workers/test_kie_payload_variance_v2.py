
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Valid JPEG Base64
base64_jpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
valid_url = "https://via.placeholder.com/150.jpg"

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
    ("image_urls (List of Objects)", {
        "prompt": "Change to blue",
        "image_urls": [{"url": valid_url}]
    }),
    ("images (List of Objects)", {
        "prompt": "Change to blue",
        "images": [{"url": valid_url}]
    }),
    ("images (List of URLs)", {
        "prompt": "Change to blue",
        "images": [valid_url]
    }),
    ("images (List of Base64)", {
        "prompt": "Change to blue",
        "images": [base64_jpeg]
    }),
    ("input_image (Base64)", {
        "prompt": "Change to blue",
        "input_image": base64_jpeg
    }),
    ("init_image (Base64)", {
        "prompt": "Change to blue",
        "init_image": base64_jpeg
    }),
    ("face_image (Base64)", {
        "prompt": "Change to blue",
        "face_image": base64_jpeg
    }),
]

for name, input_data in variations:
    try_payload(name, input_data)
