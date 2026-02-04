import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

# Add new columns to telegram_accounts table
columns_to_add = [
    ('telegram_user_id', 'TEXT'),
    ('telegram_username', 'TEXT'),
    ('first_name', 'TEXT'),
    ('last_name', 'TEXT'),
    ('account_ownership', 'TEXT DEFAULT "user_owned"'),
    ('session_status', 'TEXT DEFAULT "active"'),
]

for column_name, column_type in columns_to_add:
    try:
        c.execute(f'ALTER TABLE telegram_accounts ADD COLUMN {column_name} {column_type}')
        print(f'Added column: {column_name}')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print(f'Column {column_name} already exists, skipping')
        else:
            raise

conn.commit()
conn.close()
print('\nDatabase schema updated successfully!')
