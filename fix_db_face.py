import sqlite3
import os

db_path = os.path.join('workers', 'users.db')
face_path = "1770724709_a0f6ce20-edfe-43d5-904a-bef5d48ab99d_0.jpg"

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get active config
c.execute("SELECT active_config_id FROM telegram_accounts WHERE id = 9")
row = c.fetchone()

if row and row[0]:
    config_id = row[0]
    print(f"Updating config {config_id} with face ref: {face_path}")
    c.execute("UPDATE ai_config_presets SET model_face_ref = ? WHERE id = ?", (face_path, config_id))
    conn.commit()
    print("✅ Database updated successfully")
else:
    print("❌ No active config found for account 9")

conn.close()
