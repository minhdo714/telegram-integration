
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
base_url = "https://api.kie.ai/api/v1"
headers = {"Authorization": f"Bearer {api_key}"}

# Known public image
valid_url = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"

def verify_fix():
    url = f"{base_url}/jobs/createTask"
    
    # Fully compliant payload based on docs
    payload = {
        "model": "seedream/4.5-edit",
        "input": {
            "prompt": "Make it blue",
            "image_urls": [valid_url],
            "aspect_ratio": "1:1",
            "quality": "basic"
        }
    }
    
    print(f"\nTesting Full Payload...")
    print(f"Payload: {payload}")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_fix()
