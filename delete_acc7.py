import sqlite3; conn = sqlite3.connect('workers/users.db'); c = conn.cursor(); c.execute('DELETE FROM telegram_accounts WHERE id=7'); conn.commit(); conn.close()  
