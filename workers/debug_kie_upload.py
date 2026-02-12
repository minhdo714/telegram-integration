
import os
import requests
import base64
import logging
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('KIE_API_KEY')
headers = {"Authorization": f"Bearer {api_key}"}

# 1x1 red dot JPEG base64
base64_img = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
base64_data_uri = f"data:image/jpeg;base64,{base64_img}"

def debug_upload():
    url = "https://kieai.redpandaai.co/api/file-base64-upload"
    
    payload = {
        "base64Data": base64_data_uri,
        "fileName": "debug_dot.jpg",
        "uploadPath": "debug_uploads"
    }

    print(f"Uploading to {url}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Raw Response Text: {response.text}")
        
        try:
            print(f"JSON Response: {response.json()}")
        except:
            print("Response is not JSON")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_upload()
