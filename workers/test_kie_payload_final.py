
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

valid_url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"

variations = [
    ("face_image_url (URL)", {
        "prompt": "Change to blue",
        "face_image_url": valid_url
    }),
    ("control_image (URL)", {
        "prompt": "Change to blue",
        "control_image": valid_url
    }),
    ("init_image_url (URL)", {
        "prompt": "Change to blue",
        "init_image_url": valid_url
    }),
    ("image_url (Singular URL)", {
        "prompt": "Change to blue",
        "image_url": valid_url
    })
]

for name, input_data in variations:
    try_payload(name, input_data)
