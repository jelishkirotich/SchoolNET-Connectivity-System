# ================================
# SCHOOLNET FLASK BACKEND
# Setup + Authentication
# ================================

import os
import json
from functools import wraps
from datetime import datetime

from flask import Flask, jsonify, request, session, redirect, url_for
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import pymysql

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-fallback-key')
CORS(app, supports_credentials=True)

UPLOAD_FOLDER = os.path.join('static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xlsx', 'csv'}

# ================================
# GOOGLE OAUTH SETUP
# ================================
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# ================================
# DATABASE CONNECTION
# ================================
def get_db():
    return pymysql.connect(
        host='localhost',
        user='root',
        password=os.getenv('MYSQL_PASSWORD'),
        database='schoolnet',
        cursorclass=pymysql.cursors.DictCursor
    )

def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log_action(action, username):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO audit_logs (action, username) VALUES (%s,%s)',
            (action, username)
        )
        db.commit()
        db.close()
    except Exception:
        pass

# ================================
# ROLE-CHECK DECORATOR
# Enforced server-side - this is what actually secures the system,
# not just hiding buttons in the frontend
# ================================
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return wrapper

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'error': 'Login required'}), 401
            if session.get('role') not in allowed_roles:
                return jsonify({
                    'success': False,
                    'error': 'You do not have permission to perform this action'
                }), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

# ================================
# TEST ROUTE
# ================================
@app.route('/')
def home():
    return jsonify({
        'message': 'SchoolNET API v2 is running!',
        'version': '2.0.0'
    })

# ================================
# SIGNUP (email/password)
# ================================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not name or not email or not password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id FROM users WHERE email=%s', (email,))
        if cursor.fetchone():
            db.close()
            return jsonify({'success': False, 'error': 'An account with this email already exists'}), 409

        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, auth_provider, role, status)
            VALUES (%s,%s,%s,'email','user','Active')
        ''', (name, email, password_hash))
        db.commit()
        new_id = cursor.lastrowid
        db.close()

        log_action(f"New user signed up: {email}", email)

        session['user_id'] = new_id
        session['email'] = email
        session['name'] = name
        session['role'] = 'user'

        return jsonify({
            'success': True,
            'user': {'id': new_id, 'name': name, 'email': email, 'role': 'user'}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# LOGIN (email/password)
# ================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM users WHERE email=%s AND status="Active"', (email,))
        user = cursor.fetchone()
        db.close()

        if not user or not user['password_hash']:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        if not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        session['user_id'] = user['id']
        session['email'] = user['email']
        session['name'] = user['name']
        session['role'] = user['role']

        log_action(f"User logged in: {email}", email)

        return jsonify({
            'success': True,
            'user': {
                'id': user['id'], 'name': user['name'],
                'email': user['email'], 'role': user['role']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GOOGLE OAUTH - START
# ================================
@app.route('/api/auth/google')
def google_login():
    redirect_uri = url_for('google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

# ================================
# GOOGLE OAUTH - CALLBACK
# ================================
@app.route('/api/auth/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
        user_info = token.get('userinfo')

        if not user_info:
            return redirect('http://127.0.0.1:5500/index.html?error=google_failed')

        email = user_info['email']
        name = user_info.get('name', email.split('@')[0])
        google_id = user_info['sub']

        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM users WHERE email=%s', (email,))
        user = cursor.fetchone()

        if user:
            if not user['google_id']:
                cursor.execute(
                    'UPDATE users SET google_id=%s WHERE id=%s',
                    (google_id, user['id'])
                )
                db.commit()
            user_id = user['id']
            role = user['role']
        else:
            cursor.execute('''
                INSERT INTO users (name, email, google_id, auth_provider, role, status)
                VALUES (%s,%s,%s,'google','user','Active')
            ''', (name, email, google_id))
            db.commit()
            user_id = cursor.lastrowid
            role = 'user'

        db.close()

        session['user_id'] = user_id
        session['email'] = email
        session['name'] = name
        session['role'] = role

        log_action(f"User logged in via Google: {email}", email)

        return redirect('http://127.0.0.1:5500/pages/dashboard.html')
    except Exception as e:
        return redirect(f'http://127.0.0.1:5500/index.html?error={str(e)}')

# ================================
# LOGOUT
# ================================
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

# ================================
# CURRENT USER (session check)
# ================================
@app.route('/api/auth/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    return jsonify({
        'success': True,
        'user': {
            'id': session['user_id'],
            'name': session['name'],
            'email': session['email'],
            'role': session['role']
        }
    })
# ================================
# GET ALL INSTITUTIONS
# ================================
@app.route('/api/institutions', methods=['GET'])
@login_required
def get_institutions():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM institutions ORDER BY id')
        institutions = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': institutions, 'total': len(institutions)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GET ONE INSTITUTION (with history + issues + files)
# ================================
@app.route('/api/institutions/<int:id>', methods=['GET'])
@login_required
def get_institution(id):
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('SELECT * FROM institutions WHERE id=%s', (id,))
        institution = cursor.fetchone()
        if not institution:
            db.close()
            return jsonify({'success': False, 'error': 'Institution not found'}), 404

        cursor.execute('''
            SELECT * FROM status_history
            WHERE institution_id=%s
            ORDER BY changed_at DESC
        ''', (id,))
        institution['history'] = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM issues
            WHERE institution_id=%s
            ORDER BY created_at DESC
        ''', (id,))
        institution['issues'] = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM files
            WHERE institution_id=%s
            ORDER BY uploaded_at DESC
        ''', (id,))
        institution['files'] = cursor.fetchall()

        db.close()
        return jsonify({'success': True, 'data': institution})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# ADD INSTITUTION (User + Admin)
# ================================
@app.route('/api/institutions', methods=['POST'])
@role_required('admin', 'user')
def add_institution():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO institutions
            (region, county, sub_county, zone, nemis, name, type,
            lat, lng, status, status_detail, comments)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (
            data.get('region', 'North Rift'), data.get('county'),
            data.get('subCounty'), data.get('zone'), data.get('nemis'),
            data.get('name'), data.get('type', 'PUBLIC'),
            data.get('lat'), data.get('lng'),
            data.get('status'), data.get('statusDetail'), data.get('comments')
        ))
        new_id = cursor.lastrowid

        cursor.execute('''
            INSERT INTO status_history (institution_id, old_status, new_status, changed_by)
            VALUES (%s, NULL, %s, %s)
        ''', (new_id, data.get('status'), session['email']))

        db.commit()
        db.close()

        log_action(f"Added institution: {data.get('name')}", session['email'])

        return jsonify({'success': True, 'message': 'Institution added successfully', 'id': new_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# UPDATE INSTITUTION (User + Admin)
# Auto-logs status change to status_history
# ================================
@app.route('/api/institutions/<int:id>', methods=['PUT'])
@role_required('admin', 'user')
def update_institution(id):
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()

        cursor.execute('SELECT status FROM institutions WHERE id=%s', (id,))
        existing = cursor.fetchone()
        if not existing:
            db.close()
            return jsonify({'success': False, 'error': 'Institution not found'}), 404

        old_status = existing['status']
        new_status = data.get('status')

        cursor.execute('''
            UPDATE institutions SET
            region=%s, county=%s, sub_county=%s, zone=%s, nemis=%s,
            name=%s, type=%s, lat=%s, lng=%s, status=%s,
            status_detail=%s, comments=%s, last_verified_at=NOW()
            WHERE id=%s
        ''', (
            data.get('region', 'North Rift'), data.get('county'),
            data.get('subCounty'), data.get('zone'), data.get('nemis'),
            data.get('name'), data.get('type'), data.get('lat'), data.get('lng'),
            new_status, data.get('statusDetail'), data.get('comments'), id
        ))

        if old_status != new_status:
            cursor.execute('''
                INSERT INTO status_history (institution_id, old_status, new_status, changed_by)
                VALUES (%s,%s,%s,%s)
            ''', (id, old_status, new_status, session['email']))

        db.commit()
        db.close()

        log_action(f"Updated institution: {data.get('name')}", session['email'])

        return jsonify({'success': True, 'message': 'Institution updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# DELETE INSTITUTION (Admin only)
# ================================
@app.route('/api/institutions/<int:id>', methods=['DELETE'])
@role_required('admin')
def delete_institution(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT name FROM institutions WHERE id=%s', (id,))
        institution = cursor.fetchone()
        cursor.execute('DELETE FROM institutions WHERE id=%s', (id,))
        db.commit()
        if institution:
            log_action(f"Deleted institution: {institution['name']}", session['email'])
        db.close()
        return jsonify({'success': True, 'message': 'Institution deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# STATS (for dashboard)
# ================================
@app.route('/api/stats', methods=['GET'])
@login_required
def get_stats():
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('SELECT COUNT(*) as total FROM institutions')
        total = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Connected"')
        connected = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Scheduled"')
        scheduled = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Not Connected"')
        not_connected = cursor.fetchone()['total']

        cursor.execute('''
            SELECT county, COUNT(*) as total,
            SUM(status="Connected") as connected,
            SUM(status="Scheduled") as scheduled,
            SUM(status="Not Connected") as not_connected
            FROM institutions GROUP BY county ORDER BY total DESC
        ''')
        by_county = cursor.fetchall()

        cursor.execute('SELECT COUNT(*) as total FROM issues WHERE status="Open"')
        open_issues = cursor.fetchone()['total']

        db.close()
        return jsonify({
            'success': True,
            'data': {
                'total': total, 'connected': connected,
                'scheduled': scheduled, 'not_connected': not_connected,
                'by_county': by_county, 'open_issues': open_issues
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# ISSUES - GET ALL
# ================================
@app.route('/api/issues', methods=['GET'])
@login_required
def get_issues():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT issues.*, institutions.name AS institution_name,
            institutions.county AS county
            FROM issues
            JOIN institutions ON issues.institution_id = institutions.id
            ORDER BY issues.created_at DESC
        ''')
        issues = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': issues})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# ISSUES - REPORT (any logged-in role)
# ================================
@app.route('/api/issues', methods=['POST'])
@login_required
def report_issue():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO issues (institution_id, reported_by, title, description, severity, status)
            VALUES (%s,%s,%s,%s,%s,'Open')
        ''', (
            data.get('institutionId'), session['email'],
            data.get('title'), data.get('description'),
            data.get('severity', 'Medium')
        ))
        db.commit()
        new_id = cursor.lastrowid
        db.close()

        log_action(f"Reported issue: {data.get('title')}", session['email'])

        return jsonify({'success': True, 'message': 'Issue reported successfully', 'id': new_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# ISSUES - RESOLVE (any logged-in role)
# ================================
@app.route('/api/issues/<int:id>/resolve', methods=['PUT'])
@login_required
def resolve_issue(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            UPDATE issues SET status='Resolved', resolved_at=NOW(), resolved_by=%s
            WHERE id=%s
        ''', (session['email'], id))
        db.commit()
        db.close()

        log_action(f"Resolved issue #{id}", session['email'])

        return jsonify({'success': True, 'message': 'Issue marked as resolved'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
# ================================
# FILE UPLOAD (User + Admin)
# Saves to disk AND records in MySQL
# ================================
@app.route('/api/files/upload', methods=['POST'])
@role_required('admin', 'user')
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        institution_id = request.form.get('institutionId') or None
        description = request.form.get('description', '')

        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400

        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)

        file_type = filename.rsplit('.', 1)[1].lower()

        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO files (institution_id, uploaded_by, filename, filepath, file_type, description)
            VALUES (%s,%s,%s,%s,%s,%s)
        ''', (institution_id, session['email'], filename, filepath, file_type, description))
        db.commit()
        new_id = cursor.lastrowid
        db.close()

        log_action(f"Uploaded file: {filename}", session['email'])

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'id': new_id,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GET FILES FOR AN INSTITUTION
# ================================
@app.route('/api/files/<int:institution_id>', methods=['GET'])
@login_required
def get_institution_files(institution_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM files WHERE institution_id=%s ORDER BY uploaded_at DESC', (institution_id,))
        files = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': files})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# USERS - GET ALL (Admin only)
# ================================
@app.route('/api/users', methods=['GET'])
@role_required('admin')
def get_users():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id,name,email,role,status,auth_provider,created_at FROM users ORDER BY id')
        users = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': users})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# USERS - ADD (Admin only)
# ================================
@app.route('/api/users', methods=['POST'])
@role_required('admin')
def add_user():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        role = data.get('role', 'user')

        if not name or not email or not password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id FROM users WHERE email=%s', (email,))
        if cursor.fetchone():
            db.close()
            return jsonify({'success': False, 'error': 'Email already in use'}), 409

        password_hash = generate_password_hash(password)
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, auth_provider, role, status)
            VALUES (%s,%s,%s,'email',%s,'Active')
        ''', (name, email, password_hash, role))
        db.commit()
        db.close()

        log_action(f"Admin added user: {email} ({role})", session['email'])

        return jsonify({'success': True, 'message': 'User added successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# USERS - CHANGE ROLE (Admin only)
# ================================
@app.route('/api/users/<int:id>/role', methods=['PUT'])
@role_required('admin')
def change_user_role(id):
    try:
        data = request.get_json()
        new_role = data.get('role')

        if new_role not in ('admin', 'management', 'user'):
            return jsonify({'success': False, 'error': 'Invalid role'}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute('UPDATE users SET role=%s WHERE id=%s', (new_role, id))
        db.commit()
        db.close()

        log_action(f"Admin changed role of user #{id} to {new_role}", session['email'])

        return jsonify({'success': True, 'message': 'User role updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# USERS - DELETE (Admin only)
# ================================
@app.route('/api/users/<int:id>', methods=['DELETE'])
@role_required('admin')
def delete_user(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT email FROM users WHERE id=%s', (id,))
        user = cursor.fetchone()
        cursor.execute('DELETE FROM users WHERE id=%s', (id,))
        db.commit()
        db.close()

        if user:
            log_action(f"Admin deleted user: {user['email']}", session['email'])

        return jsonify({'success': True, 'message': 'User deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# AUDIT LOGS (Admin + Management)
# ================================
@app.route('/api/logs', methods=['GET'])
@role_required('admin', 'management')
def get_logs():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50')
        logs = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': logs})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# PUBLIC ROUTES - NO LOGIN REQUIRED
# Powers the public transparency dashboard
# ================================
@app.route('/api/public/stats', methods=['GET'])
def public_stats():
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('SELECT COUNT(*) as total FROM institutions')
        total = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Connected"')
        connected = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Scheduled"')
        scheduled = cursor.fetchone()['total']

        cursor.execute('SELECT COUNT(*) as total FROM institutions WHERE status="Not Connected"')
        not_connected = cursor.fetchone()['total']

        cursor.execute('''
            SELECT county, COUNT(*) as total,
            SUM(status="Connected") as connected
            FROM institutions GROUP BY county ORDER BY total DESC
        ''')
        by_county = cursor.fetchall()

        db.close()
        return jsonify({
            'success': True,
            'data': {
                'total': total, 'connected': connected,
                'scheduled': scheduled, 'not_connected': not_connected,
                'by_county': by_county
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/public/institutions', methods=['GET'])
def public_institutions():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, name, county, sub_county, lat, lng, status, last_verified_at
            FROM institutions
        ''')
        institutions = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': institutions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# RUN APP
# ================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)    
    