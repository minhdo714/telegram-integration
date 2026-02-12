
import requests

def check_port(port, name):
    try:
        print(f"Checking http://localhost:{port} ({name})...")
        response = requests.get(f"http://localhost:{port}", timeout=2)
        print(f"{name} Status: {response.status_code}")
        if response.ok:
            print(f"{name} is running!")
        else:
            print(f"{name} returned error status.")
        return True
    except Exception as e:
        print(f"Could not connect to {name}: {e}")
        return False

frontend = check_port(3000, "Frontend")
backend = check_port(5000, "Backend")

