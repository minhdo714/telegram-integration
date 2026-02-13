import asyncio
import sys
import os

# Add workers to path
sys.path.append(os.path.join(os.getcwd(), 'workers'))

from telethon_handler import search_groups

def test_search():
    print("--- START SEARCH TEST ---")
    account_id = 9
    query = "cryptonews" # Common keyword
    print(f"Searching for: {query}")
    
    # search_groups is NOT async, it uses its own loop internaly
    result = search_groups(account_id, query)
    print(f"Result: {result}")
    print("--- END SEARCH TEST ---")

if __name__ == "__main__":
    test_search()
