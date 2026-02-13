if __name__ == "__main__":
    from telethon_handler import scrape_members
    import traceback
    
    account_id = 9
    group_username = 'cryptonews'
    
    print(f"--- START SCRAPE TEST ---")
    print(f"Account ID: {account_id}")
    print(f"Group: {group_username}")
    
    try:
        result = scrape_members(account_id, group_username, limit=10)
        print(f"Result Type: {type(result)}")
        print(f"Scrape Result: {result}")
    except Exception as e:
        print(f"FALAL ERROR in test script: {e}")
        traceback.print_exc()
    print(f"--- END SCRAPE TEST ---")
