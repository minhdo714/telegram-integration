
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

# 512x512 JPEG Base64
img = Image.new('RGB', (512, 512), color = 'red')
buffer = io.BytesIO()
img.save(buffer, format="JPEG")
base64_jpeg = f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

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
    ("control_image (Base64)", {"prompt": "blue", "control_image": base64_jpeg}),
    ("mask_image (Base64)", {"prompt": "blue", "mask_image": base64_jpeg}),
    ("init_image (Base64)", {"prompt": "blue", "init_image": base64_jpeg}),
    ("image (Base64)", {"prompt": "blue", "image": base64_jpeg}),
    ("face_image (Base64)", {"prompt": "blue", "face_image": base64_jpeg})
]

for name, input_data in variations:
    try_payload(name, input_data)
