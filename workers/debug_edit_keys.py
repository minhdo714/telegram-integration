
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Known public image
valid_url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"

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
    ("image_urls ONLY", {"prompt": "blue", "image_urls": [valid_url]}),
    ("image_urls + mask_url", {
        "prompt": "blue", 
        "image_urls": [valid_url],
        "mask_url": valid_url # Using same image as mask for test
    }),
    ("image_urls + mask_image (Base64)", {
        "prompt": "blue", 
        "image_urls": [valid_url],
        "mask_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    }),
     ("T2I with face_image_url", {
        "prompt": "blue", 
        "face_image_url": valid_url
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
