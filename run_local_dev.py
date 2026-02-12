import subprocess
import os
import sys
import threading
import time

def run_backend():
    print("[BACKEND] Starting Flask Worker...")
    try:
         # Use python from active venv if possible, else sys.executable
        subprocess.run([sys.executable, "workers/worker.py"], check=True)
    except Exception as e:
        print(f"[BACKEND] Error: {e}")

def run_frontend():
    print("[FRONTEND] Starting Next.js...")
    try:
        # Assumes npm is in PATH
        subprocess.run(["npm", "run", "dev"], shell=True, check=True)
    except Exception as e:
        print(f"[FRONTEND] Error: {e}")

if __name__ == "__main__":
    print("=== Telegram Integration Local Runner ===")
    print("Starting backend and frontend concurrently...")
    
    # Start Backend in a separate thread/process
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Give backend a moment to initialize
    time.sleep(2)
    
    # Start Frontend in main thread (blocking)
    run_frontend()
