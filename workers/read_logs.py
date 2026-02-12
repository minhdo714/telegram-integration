import subprocess
import time

# Get last 60 lines of bot.log
result = subprocess.run(
    ['powershell', '-Command', 'Get-Content bot.log -Tail 60'],
    cwd='e:/Projects/Webapp_OF management/telegram-integration/workers',
    capture_output=True,
    text=True
)

print("="*70)
print("RECENT BOT LOGS:")
print("="*70)
print(result.stdout)

if result.stderr:
    print("\nERRORS:")
    print(result.stderr)
