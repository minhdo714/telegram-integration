
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

def try_payload(name, url_list):
    url = f"{base_url}/jobs/createTask"
    payload = {
        "model": "seedream/4.5-edit",
        "input": {
            "prompt": "Change to blue",
            "image_urls": url_list
        }
    }
    print(f"\nTesting {name} with {url_list}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# Known public image
google_logo = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
placehold = "https://via.placeholder.com/150.jpg"

# Constructed paths from previous experiment
# path was: kieai/154790/test_uploads/dummy_test_image.jpg
path = "kieai/154790/test_uploads/dummy_test_image.jpg"
constructed_1 = f"https://kieai.redpandaai.co/{path}"
constructed_2 = f"https://kieai.redpandaai.co/uploads/{path}"
constructed_3 = f"https://api.kie.ai/uploads/{path}"

variations = [
    ("Google Logo (PNG)", [google_logo]),
    ("Placeholder (JPG)", [placehold]),
    ("Constructed 1", [constructed_1]),
    ("Constructed 2", [constructed_2])
]

for name, url_list in variations:
    try_payload(name, url_list)
