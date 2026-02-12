
import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# 1x1 red dot png base64
base64_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def try_payload(name, input_data):
    url = f"{base_url}/jobs/createTask"
    payload = {
        "model": "seedream/4.5-edit", # Switch to EDIT model
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
    ("No Image (Expect Fail)", {
        "prompt": "Change to blue",
        "aspect_ratio": "1:1",
        "quality": "basic"
    }),
    ("With image_urls (List)", {
        "prompt": "Change to blue",
        "image_urls": [base64_img]
    }),
    ("With images (List)", {
        "prompt": "Change to blue",
        "images": [base64_img]
    }),
    ("With input_image (String)", {
        "prompt": "Change to blue",
        "input_image": base64_img
    }),
    ("With init_image (String)", {
        "prompt": "Change to blue",
        "init_image": base64_img
    }),
     ("With face_image (String)", {
        "prompt": "Change to blue",
        "face_image": base64_img
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
