import requests
import os
import time
import base64
import logging
import mimetypes
import traceback

ATLAS_API_KEY = os.getenv('ATLAS_API_KEY', 'apikey-65875fefe4894b3b810ba6b4d554b7ca')
ATLAS_GEN_URL = 'https://api.atlascloud.ai/api/v1/model/generateImage'
ATLAS_POLL_URL = 'https://api.atlascloud.ai/api/v1/model/prediction/{}'
ATLAS_MODEL = 'bytedance/seedream-v4.5/edit'


class AtlasClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or ATLAS_API_KEY
        self.logger = logging.getLogger(__name__)

        log_path = '/tmp/atlas_debug.log' if os.name != 'nt' else 'atlas_debug.log'
        fh = logging.FileHandler(log_path)
        fh.setLevel(logging.INFO)
        fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        self.logger.addHandler(fh)

        if not self.api_key:
            self.logger.warning("ATLAS_API_KEY not set. Image generation will fail.")

    def generate_image(self, prompt, face_ref_path=None, body_ref_path=None):
        """
        Generate an image via AtlasCloud Seedream v4.5 edit model.
        Always uses uncensored/NSFW mode. Optionally includes a reference image.
        """
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }

        full_prompt = self._build_uncensored_prompt(prompt)

        payload = {
            'model': ATLAS_MODEL,
            'prompt': full_prompt,
            'width': 512,
            'height': 768,
            'steps': 20,
            'guidance_scale': 7.5,
        }

        # Attach reference image if provided
        ref_path = face_ref_path or body_ref_path
        if ref_path:
            self.logger.info(f"Encoding reference image: {ref_path}")
            b64 = self._encode_image(ref_path)
            if b64:
                mime, _ = mimetypes.guess_type(ref_path)
                mime = mime or 'image/jpeg'
                payload['image'] = f"data:{mime};base64,{b64}"
            else:
                self.logger.warning("Could not encode reference image — generating without it")

        self.logger.info(f"Submitting to AtlasCloud. Prompt: {full_prompt[:120]}")

        try:
            r = requests.post(ATLAS_GEN_URL, headers=headers, json=payload, timeout=30)
            self.logger.info(f"Submit status: {r.status_code} | {r.text[:400]}")

            if not r.ok:
                return {'error': f'AtlasCloud submit error {r.status_code}: {r.text}'}

            result = r.json()
            prediction_id = (result.get('data') or {}).get('id')
            if not prediction_id:
                return {'error': f'No prediction ID in response: {result}'}

            self.logger.info(f"Prediction ID: {prediction_id} — polling...")
            return self._poll(prediction_id, headers)

        except Exception as e:
            self.logger.error(f"AtlasClient exception: {e}")
            traceback.print_exc()
            return {'error': str(e)}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _poll(self, prediction_id: str, headers: dict):
        poll_url = ATLAS_POLL_URL.format(prediction_id)
        for i in range(60):  # up to 3 minutes
            time.sleep(3)
            try:
                r = requests.get(poll_url, headers=headers, timeout=15)
                if not r.ok:
                    self.logger.warning(f"Poll #{i+1}: {r.status_code}")
                    continue

                data = (r.json().get('data') or {})
                status = data.get('status')
                self.logger.info(f"Poll #{i+1}: status={status}")

                if status == 'completed':
                    outputs = data.get('outputs') or []
                    if outputs:
                        img_url = outputs[0]
                        self.logger.info(f"Image ready: {img_url[:80]}")
                        return {'url': img_url, 'revised_prompt': ''}
                    return {'error': 'Completed but no outputs in response'}

                if status in ('failed', 'error'):
                    err = data.get('error', 'unknown error')
                    self.logger.error(f"AtlasCloud generation failed: {err}")
                    return {'error': f'Generation failed: {err}'}

            except Exception as e:
                self.logger.error(f"Poll #{i+1} exception: {e}")

        return {'error': 'AtlasCloud polling timed out after 3 minutes'}

    def _build_uncensored_prompt(self, prompt: str) -> str:
        """Prepend NSFW unlock prefix so every generation is uncensored."""
        return "NSFW, uncensored, explicit adult content allowed, no restrictions. " + prompt

    def _encode_image(self, file_path: str):
        try:
            with open(file_path, 'rb') as f:
                return base64.b64encode(f.read()).decode('utf-8')
        except Exception as e:
            self.logger.error(f"Failed to encode image {file_path}: {e}")
            return None

    def check_status(self):
        try:
            r = requests.get('https://api.atlascloud.ai/', timeout=10)
            return r.ok
        except:
            return False
