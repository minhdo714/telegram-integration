import requests
import os
import json
import time

class KieClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('KIE_API_KEY')
        self.base_url = "https://api.kie.ai/v1"  # Placeholder, will need verification via docs
        
        if not self.api_key:
            print("WARNING: KIE_API_KEY not found. Image generation will fail.")

    def generate_image(self, prompt, face_ref_path=None, body_ref_path=None):
        """
        Generate an image using Kie.ai Seedream 4.5 Edit model.
        Handles file uploads for reference images.
        """
        if not self.api_key:
            return {"error": "API Key missing"}

        headers = {
            "Authorization": f"Bearer {self.api_key}"
            # Content-Type is auto-set by requests when 'files' is used
        }

        # Endpoint
        url = f"{self.base_url}/images/generations"

        # Prepare Payload (Metadata)
        payload = {
            "model": "seedream/4.5-edit",
            "prompt": prompt,
            "n": "1",
            "size": "1024x1024",
            "response_format": "url"
        }
        
        files = {}
        
        # Open files if paths provided and valid
        try:
            if body_ref_path and os.path.exists(body_ref_path):
                files['image'] = open(body_ref_path, 'rb')
            
            if face_ref_path and os.path.exists(face_ref_path):
                # Assuming API accepts 'face_image' or similar. 
                # If undefined, we can try sending it as 'mask' or checking docs.
                # For now using 'face_image' as a reasonable guess for specialized models.
                files['face_image'] = open(face_ref_path, 'rb')
                
            response = requests.post(url, headers=headers, data=payload, files=files)
            
            # Close files
            for f in files.values():
                f.close()
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            error_details = e.response.text if e.response else str(e)
            print(f"Kie.ai Error: {error_details}")
            return {"error": f"API Error: {error_details}"}
        except Exception as e:
            print(f"Kie.ai Client Error: {e}")
            return {"error": str(e)}
        finally:
            # Ensure files are closed
            for f in files.values():
                if not f.closed:
                    f.close()

    def check_status(self):
        """Check API health/status"""
        try:
            response = requests.get(f"{self.base_url}/status")
            return response.ok
        except:
            return False

# Example usage
if __name__ == "__main__":
    client = KieClient()
    # print(client.generate_image("A beautiful model in red lingerie"))
