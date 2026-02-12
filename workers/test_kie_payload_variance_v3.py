
import os
import requests
import base64
import io
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Generate 512x512 black JPEG
img = Image.new('RGB', (512, 512), color = 'black')
buffer = io.BytesIO()
img.save(buffer, format="JPEG")
base64_raw = base64.b64encode(buffer.getvalue()).decode('utf-8')
base64_prefixed = f"data:image/jpeg;base64,{base64_raw}"

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
    ("image_urls (512x512 Prefixed)", {
        "prompt": "Change to blue",
        "image_urls": [base64_prefixed]
    }),
    ("image_urls (512x512 Raw Base64)", {
        "prompt": "Change to blue",
        "image_urls": [base64_raw]
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
