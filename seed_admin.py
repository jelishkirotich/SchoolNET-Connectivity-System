import os
import pymysql
from werkzeug.security import generate_password_hash

# Adjust DB settings or use environment variables
DB_HOST = os.getenv('MYSQL_HOST', 'localhost')
DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASS = os.getenv('MYSQL_PASSWORD')
DB_NAME = os.getenv('MYSQL_DATABASE', 'schoolnet')

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'adminpass')

conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME, cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()

hashed = generate_password_hash(ADMIN_PASSWORD)
cur.execute('SELECT id FROM users WHERE email=%s', (ADMIN_EMAIL,))
if cur.fetchone():
    print('Admin user already exists')
else:
    cur.execute('''
        INSERT INTO users (name, email, password_hash, role, status, created_at)
        VALUES (%s,%s,%s,%s,%s,NOW())
    ''', ('Administrator', ADMIN_EMAIL, hashed, 'admin', 'Active'))
    conn.commit()
    print('Admin user created')

conn.close()
