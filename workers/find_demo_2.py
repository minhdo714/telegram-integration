import sqlite3
import os

db_paths = [
    r'E:\Projects\Webapp_OF management\telegram-integration\users.db',
    r'E:\Projects\Webapp_OF management\telegram-integration\workers\users.db'
]

found = False
for db_path in db_paths:
    if not os.path.exists(db_path):
        continue
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    try:
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in c.fetchall()]
        
        for table in tables:
            try:
                c.execute(f"SELECT * FROM {table}")
                rows = c.fetchall()
            except Exception:
                continue
                
            for row in rows:
                for key in row.keys():
                    val = row[key]
                    if isinstance(val, str) and 'automated demo' in val.lower():
                        found = True
                        pk = row['id'] if 'id' in row.keys() else row.get('account_id', 'unknown')
                        print(f"FOUND IN {db_path} -> table={table}, column={key}, id={pk}")
                        
                        try:
                            pk_col = 'id' if 'id' in row.keys() else 'account_id'
                            update_sql = f"UPDATE {table} SET {key} = NULL WHERE {pk_col} = ?"
                            c.execute(update_sql, (pk,))
                            print(f"  -> Updated to NULL.")
                        except sqlite3.Error as e:
                            print(f"  -> Failed to update: {e}")
                            
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if not found:
    print("NO MATCHES FOUND FOR 'automated demo' IN EITHER DB.")
