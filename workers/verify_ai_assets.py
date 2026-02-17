from ai_handler import AIHandler
import os
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

def test_asset_lookup():
    handler = AIHandler()
    account_id = 9
    assets = handler._get_account_assets(account_id)
    
    print(f"Results for Account {account_id}:")
    if not assets:
        print("FAIL: No assets found.")
        return

    print(json.dumps(assets, indent=2))
    
    # Assertions
    if assets.get('model_face_ref') and '1771276810' in assets['model_face_ref']:
        print("SUCCESS: model_face_ref correctly fell back to model_assets value.")
    else:
        print("FAIL: model_face_ref is missing or incorrect.")

    if assets.get('system_prompt') == "You are a flirty, fun, and engaging OF model. Keep messages short, lowercase, and casual.":
        print("SUCCESS: system_prompt correctly picked from Preset 3.")
    else:
        print(f"FAIL: system_prompt is incorrect: {assets.get('system_prompt')}")

if __name__ == "__main__":
    test_asset_lookup()
