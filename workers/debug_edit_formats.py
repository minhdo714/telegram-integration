
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

# Generate 512x512 black WebP
img = Image.new('RGB', (512, 512), color = 'black')
buffer = io.BytesIO()
img.save(buffer, format="WEBP")
base64_webp = base64.b64encode(buffer.getvalue()).decode('utf-8')
base64_webp_prefixed = f"data:image/webp;base64,{base64_webp}"

# From previous successful upload
raw_file_path = "kieai/154790/debug_uploads/debug_dot.jpg"
download_url = "https://tempfile.redpandaai.co/kieai/154790/debug_uploads/debug_dot.jpg"

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
    ("image_urls (WebP Base64)", {
        "prompt": "Change to blue",
        "image_urls": [base64_webp_prefixed]
    }),
    ("image_urls (Raw FilePath)", {
        "prompt": "Change to blue",
        "image_urls": [raw_file_path]
    }),
    ("image_urls (Download URL)", {
        "prompt": "Change to blue",
        "image_urls": [download_url]
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
