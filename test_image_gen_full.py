import sys
import os
import asyncio
import logging
import json
import sqlite3

# Add workers directory to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from kie_client import KieClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_image_gen():
    print("--- TESTING IMAGE GENERATION PIPELINE ---")
    
    # 1. Check API Key
    api_key = os.getenv('KIE_API_KEY')
    if not api_key:
        print("❌ KIE_API_KEY not found in env!")
        return
    print(f"✅ API Key found: {api_key[:5]}...")
    
    client = KieClient(api_key=api_key)
    
    # 2. Get active assets for account 9
    db_path = os.path.join('workers', 'users.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT active_config_id FROM telegram_accounts WHERE id = 9")
    row = c.fetchone()
    
    face_path = None
    if row and row['active_config_id']:
        c.execute("SELECT model_face_ref FROM ai_config_presets WHERE id = ?", (row['active_config_id'],))
        res = c.fetchone()
        if res and res['model_face_ref']:
            # Construct full path
            # Assuming logic from ai_handler: upload_base/account_id/face/basename
            upload_base = os.path.join(os.getcwd(), 'workers', 'uploads')
            # CHECK: ai_handler line 191 says: os.path.join(upload_base, str(assets['account_id']), 'face', os.path.basename(assets['model_face_ref']))
            # BUT we need to be sure. Let's look at what's in the DB.
            db_ref = res['model_face_ref']
            print(f"DB Face Ref: {db_ref}")
            
            # Try to find the file
            possible_paths = [
                 os.path.join(upload_base, '9', 'face', os.path.basename(db_ref)),
                 os.path.join(upload_base, db_ref) # logic might differ
            ]
            
            for p in possible_paths:
                if os.path.exists(p):
                    face_path = p
                    print(f"✅ Found face image at: {face_path}")
                    break
            
            if not face_path:
                print(f"❌ Face image NOT found at any expected path: {possible_paths}")
                # List contents of upload dir to debug
                if os.path.exists(os.path.join(upload_base, '9', 'face')):
                     print(f"Contents of {os.path.join(upload_base, '9', 'face')}: {os.listdir(os.path.join(upload_base, '9', 'face'))}")
                return

    if not face_path:
        print("❌ No face reference configured for account 9!")
        return

    # 3. Test Kie.ai Upload
    print("\n--- STEP 3: Uploading Reference ---")
    url = client.upload_image(face_path)
    if not url:
        print("❌ Upload failed!")
        return
    print(f"✅ Upload success: {url}")
    
    # 4. Test Generation
    print("\n--- STEP 4: Generating Image ---")
    print("Prompt: 'red lingerie tease'")
    
    # We need to run this in a thread if it's blocking, but here we can call directly?
    # KieClient.generate_image is blocking (requests).
    result = client.generate_image("red lingerie tease", face_ref_path=face_path)
    
    if result.get('url'):
        print(f"✅ GENERATION SUCCESS: {result['url']}")
    else:
        print(f"❌ GENERATION FAILED: {result}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.getcwd(), '.env'))
    asyncio.run(test_image_gen())
