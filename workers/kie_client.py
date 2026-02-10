import requests
import os
import json
import json
import time
import json
import time
import base64
import logging
import mimetypes
import traceback

class KieClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('KIE_API_KEY')
        self.base_url = "https://api.kie.ai/api/v1"  # Correct base URL for tasks
        
        self.logger = logging.getLogger(__name__)
        
        if not self.api_key:
            self.logger.warning("KIE_API_KEY not found. Image generation will fail.")

    def generate_image(self, prompt, face_ref_path=None, body_ref_path=None):
        """
        Generate an image using Kie.ai Seedream 4.5 Edit model.
        Strictly requires a reference image and uses the Edit model.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Base URL for creating tasks
        url = f"{self.base_url}/jobs/createTask"
        
        # Determine reference path
        ref_path = face_ref_path or body_ref_path
        
        if not ref_path:
             self.logger.error("Seedream 4.5 Edit requires a reference image (face or body). None provided.")
             return {"error": "Reference image required for Seedream 4.5 Edit"}

        self.logger.info(f"Processing reference image for Edit: {ref_path}")
        
        try:
            # 1. Upload the image to get a URL
            uploaded_url = self.upload_image(ref_path)
            
            if not uploaded_url:
                return {"error": "Failed to upload reference image"}

            self.logger.info(f"Image uploaded successfully: {uploaded_url}")
            
            # 2. Construct Edit Payload
            edit_payload = {
                "model": "seedream/4.5-edit",
                "input": {
                    "prompt": prompt,
                    "image_urls": [uploaded_url],
                    "aspect_ratio": "1:1",
                    "quality": "basic"
                }
            }
            
            self.logger.info("Attempting Seedream 4.5 Edit generation...")
            response = requests.post(url, headers=headers, json=edit_payload)
            
            self.logger.info(f"Task creation response status: {response.status_code}")
            self.logger.info(f"Task creation response body: {response.text}")
            
            # Check response
            if response.ok:
                    json_response = response.json()
                    self.logger.info(f"Task creation JSON: {json.dumps(json_response, indent=2)}")
                    
                    data = json_response.get('data') or {}
                    task_id = data.get('taskId') or data.get('task_id')
                    
                    if task_id:
                        self.logger.info(f"Edit Task Created: {task_id}")
                        self.logger.info(f"Full data object: {json.dumps(data, indent=2)}")
                        return self._poll_task(task_id, headers)
                    else:
                        self.logger.error(f"Edit response OK but no task_id: {json_response}")
                        return {"error": "No task ID returned from API"}
            else:
                self.logger.error(f"Edit request failed: {response.status_code} - {response.text}")
                return {"error": f"API Request Failed: {response.text}"}
                
        except Exception as e:
            self.logger.error(f"Exception during Edit workflow: {e}")
            traceback.print_exc()
            return {"error": str(e)}

    def upload_image(self, file_path):
        """Uploads a local file to Kie.ai and returns the URL"""
        try:
            url = "https://kieai.redpandaai.co/api/file-base64-upload"
            
            with open(file_path, "rb") as image_file:
                 base64_data = base64.b64encode(image_file.read()).decode('utf-8')
                 
                
            # Detect Mime Type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'image/jpeg' # Default
                
            payload = {
                "base64Data": f"data:{mime_type};base64,{base64_data}",
                "fileName": os.path.basename(file_path),
                "uploadPath": "telegram_bot_uploads"
            }
            

            
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            response = requests.post(url, headers=headers, json=payload)
            if response.ok:
                data = response.json().get('data', {})
                url = data.get('url') or data.get('downloadUrl')
                if not url:
                     # Check for filePath if url is missing (Kie.ai specific?)
                     if data.get('filePath'):
                         # Construct URL if missing but have path (fallback)
                         # But prefer downloadUrl if exists
                         self.logger.info(f"Using filePath as URL: {data['filePath']}")
                         return data['filePath']
                     
                     self.logger.warning(f"Upload OK but no URL in data: {data}")
                return url
            else:
                self.logger.error(f"Upload Failed: {response.text}")
                return None
        except Exception as e:
            self.logger.error(f"Upload Exception: {e}", exc_info=True)
            return None

    def _poll_task(self, task_id, headers):
        # Correct endpoint from official documentation
        url = f"{self.base_url}/jobs/recordInfo"
        self.logger.info(f"Polling Kie.ai task {task_id}...")
        self.logger.info(f"Poll URL: {url}?taskId={task_id}")
        
        for i in range(90): # Wait up to 180 seconds
            try:
                # Pass taskId as query parameter (not in path!)
                response = requests.get(url, headers=headers, params={"taskId": task_id})
                self.logger.info(f"Poll #{i+1}: Status Code {response.status_code}")
                
                if not response.ok:
                    self.logger.warning(f"Poll #{i+1}: Non-OK response: {response.status_code} - {response.text[:200]}")
                    time.sleep(2)
                    continue
                    
                json_response = response.json()
                self.logger.info(f"Poll #{i+1}: Response keys: {json_response.keys() if json_response else 'EMPTY'}")
                
                if not json_response:
                    self.logger.warning(f"Poll #{i+1}: Empty JSON response")
                    time.sleep(2)
                    continue
                    
                data = json_response.get('data') or {}
                state = data.get('state')  # Note: it's 'state' not 'status' according to docs
                self.logger.info(f"Poll #{i+1}: State = {state}")
                
                if state == 'success':
                    # Extract results from resultJson field (it's a JSON string!)
                    result_json_str = data.get('resultJson', '{}')
                    self.logger.info(f"Poll #{i+1}: SUCCESS with resultJson: {result_json_str}")
                    
                    try:
                        result_data = json.loads(result_json_str)
                        result_urls = result_data.get('resultUrls', [])
                        
                        if result_urls and len(result_urls) > 0:
                            img_url = result_urls[0]
                            self.logger.info(f"Poll #{i+1}: Extracted URL: {img_url}")
                            return {"url": img_url, "revised_prompt": ""}
                        else:
                            self.logger.warning(f"Poll #{i+1}: SUCCESS but no resultUrls in resultJson")
                    except json.JSONDecodeError as e:
                        self.logger.error(f"Poll #{i+1}: Failed to parse resultJson: {e}")
                        
                elif state == 'fail':
                    fail_msg = data.get('failMsg', 'Unknown')
                    fail_code = data.get('failCode', '')
                    self.logger.error(f"Poll #{i+1}: Task FAILED: [{fail_code}] {fail_msg}")
                    return {"error": f"Generation failed: {fail_msg}"}
                elif state in ['waiting', 'queuing', 'generating']:
                    self.logger.info(f"Poll #{i+1}: State '{state}' - continuing to poll...")
                else:
                    self.logger.warning(f"Poll #{i+1}: Unknown state '{state}'")
                    
            except Exception as e:
                self.logger.error(f"Poll #{i+1}: Exception: {e}", exc_info=True)
                
            time.sleep(2)
            
        self.logger.error(f"Polling timed out after {90*2} seconds")
        return {"error": "Generation timed out"}

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
