# ================================
# SEED DEFAULT USERS WITH REAL HASHES
# Run once to set working passwords
# ================================

from werkzeug.security import generate_password_hash
import pymysql

db = pymysql.connect(
    host='localhost',
    user='root',
    password='gloriajelimo6611', 
    database='schoolnet'
)
cursor = db.cursor()

users = [
    ('admin@schoolnet.go.ke', 'Admin@123'),
    ('manager@schoolnet.go.ke', 'Manager@123'),
    ('agent@schoolnet.go.ke', 'Agent@123'),
]

for email, plain_password in users:
    hashed = generate_password_hash(plain_password)
    cursor.execute(
        "UPDATE users SET password_hash = %s WHERE email = %s",
        (hashed, email)
    )

db.commit()
db.close()
print("Passwords set successfully!")
print("admin@schoolnet.go.ke / Admin@123")
print("manager@schoolnet.go.ke / Manager@123")
print("agent@schoolnet.go.ke / Agent@123")