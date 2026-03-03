import sqlite3, json
conn = sqlite3.connect('users.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
outreach = [dict(r) for r in c.execute('SELECT id, name, model_face_ref FROM outreach_configs').fetchall()]
accounts = [dict(r) for r in c.execute('SELECT id, active_outreach_config_id FROM telegram_accounts').fetchall()]
assets = [dict(r) for r in c.execute('SELECT account_id, model_face_ref FROM model_assets').fetchall()]
with open('db_dump.json', 'w', encoding='utf-8') as f:
    json.dump({'outreach': outreach, 'accounts': accounts, 'assets': assets}, f, indent=2)
