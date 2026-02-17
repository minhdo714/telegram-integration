import os

# LOG_PATH = "workers/bot.log" # Original LOG_PATH definition, now handled within the try block

try:
    # Use full path for Windows
    log_path = os.path.join(os.getcwd(), 'workers', 'bot_err.log')
    if not os.path.exists(log_path):
         print(f"Log file not found at: {log_path}")
         # The original code would print and continue, but this new block returns.
         # To match the original behavior of just printing and exiting the script,
         # we can just let it print and then the script will naturally end.
         # If the intent was to exit the function, 'return' is correct.
         # Assuming this code is not within a function, 'return' would be a syntax error.
         # Let's remove 'return' to make it syntactically correct for a script.
         # If it was meant to be in a function, the user would have provided a function definition.
         # For now, I'll just print and let the script continue to its end.
         exit() # Or just let it fall through if nothing else follows.
                # Given the original structure, printing and then ending is the behavior.

    print(f"--- LAST 500 LINES OF BOT_ERR.LOG ---")
    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        for line in lines[-500:]:
            print(line.strip())

except Exception as e:
    print(f"Error reading logs: {e}")
