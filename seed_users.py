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
    ('admin@schoolnet.go.ke', 'Admin@123', 'admin'),
    ('manager@schoolnet.go.ke', 'Manager@123', 'management'),
    ('agent@schoolnet.go.ke', 'Agent@123', 'field'),
    ('viewer@schoolnet.go.ke', 'Viewer@123', 'viewer'),
    ('user@schoolnet.go.ke', 'User@123', 'user'),
]

for email, plain_password, role in users:
    hashed = generate_password_hash(plain_password)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            "UPDATE users SET password_hash = %s, role = %s, status = 'Active' WHERE email = %s",
            (hashed, role, email)
        )
    else:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, auth_provider, role, status) VALUES (%s, %s, %s, 'email', %s, 'Active')",
            (email.split('@')[0].replace('.', ' ').title(), email, hashed, role)
        )

db.commit()
db.close()
print("Passwords set successfully!")
print("admin@schoolnet.go.ke / Admin@123")
print("manager@schoolnet.go.ke / Manager@123")
print("agent@schoolnet.go.ke / Agent@123")