
import sqlite3
import os

DB_PATH = 'users.db'
# Simulate ai_handler.py path
WORKER_DIR = os.getcwd()
UPLOAD_BASE = os.path.join(WORKER_DIR, 'uploads')

def check_paths():
    print(f"WORKER_DIR: {WORKER_DIR}")
    print(f"UPLOAD_BASE: {UPLOAD_BASE}")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM model_assets")
    rows = c.fetchall()
    conn.close()
    
    for row in rows:
        print(f"\nScanning Asset ID: {row['id']} (Account {row['account_id']})")
        face_ref = row['model_face_ref']
        print(f"DB Value 'model_face_ref': {face_ref}")
        
        if face_ref:
            full_path = os.path.join(UPLOAD_BASE, face_ref)
            exists = os.path.exists(full_path)
            print(f"Constructed Path: {full_path}")
            print(f"File Exists: {exists}")
            
            if not exists:
                # Try finding where it actually is
                print("Searching for file...")
                for root, dirs, files in os.walk(UPLOAD_BASE):
                    if os.path.basename(face_ref) in files:
                         print(f"Found similar file at: {os.path.join(root, os.path.basename(face_ref))}")

if __name__ == "__main__":
    check_paths()
