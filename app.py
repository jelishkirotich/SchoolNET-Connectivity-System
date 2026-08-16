# ================================
# SCHOOLNET FLASK BACKEND
# Setup + Authentication
# ================================

import os
import csv
import io
import json
import socket
import traceback
import subprocess
import threading
import time
from functools import wraps
from datetime import datetime, timedelta

from flask import Flask, jsonify, request, session, redirect, url_for, render_template, send_file
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import pymysql
import logging
from logging.handlers import RotatingFileHandler
import secrets

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-fallback-key')
# Configure CORS origins from environment for safer production defaults
allowed = os.getenv('ALLOWED_ORIGINS')
if allowed:
    origins = [o.strip() for o in allowed.split(',') if o.strip()]
else:
    origins = ['http://127.0.0.1:5500']

CORS(app, supports_credentials=True, origins=origins)

# Session and cookie security (override via env in production)
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
app.config['SESSION_COOKIE_SAMESITE'] = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=int(os.getenv('SESSION_LIFETIME_MIN', '60')))

# Feature flags controlled by environment
ENABLE_CSRF = os.getenv('ENABLE_CSRF', 'False') == 'True'
FORCE_HTTPS = os.getenv('FORCE_HTTPS', 'False') == 'True'
MONITOR_ENABLED = os.getenv('MONITOR_ENABLED', 'False') == 'True'

# Configure basic file logging for the application
log_handler = RotatingFileHandler('app.log', maxBytes=5*1024*1024, backupCount=3)
log_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))
log_handler.setLevel(logging.INFO)
app.logger.addHandler(log_handler)
app.logger.setLevel(logging.INFO)

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


def check_ip_connectivity(ip_address):
    ip_value = (ip_address or '').strip()
    if not ip_value:
        return 'Unknown', 'No IP address configured'

    try:
        socket.gethostbyname(ip_value)
    except Exception:
        return 'Not Connected', 'IP address could not be resolved'

    # Try a simple ICMP ping first. This works better for raw host reachability
    # when the target is not necessarily running a network service. If ICMP
    # fails, attempt TCP connections on common service ports as a fallback.
    try:
        ping_cmd = ['ping', '-n', '1', '-w', '2000', ip_value] if os.name == 'nt' else ['ping', '-c', '1', '-W', '2', ip_value]
        completed = subprocess.run(ping_cmd, capture_output=True, text=True)
        if completed.returncode == 0:
            return 'Connected', 'Host is reachable by ICMP ping'
    except Exception:
        pass

    for port in (80, 443, 22, 53):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            sock.connect((ip_value, port))
            sock.close()
            return 'Connected', f'IP responded on port {port} (TCP)'
        except Exception:
            continue

    return 'Not Connected', 'IP host did not respond during monitoring'


def scan_institutions_for_connectivity():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id, name, ip_address, status FROM institutions WHERE ip_address IS NOT NULL AND TRIM(ip_address) <> ""')
        institutions = cursor.fetchall()

        for inst in institutions:
            try:
                new_status, detail = check_ip_connectivity(inst['ip_address'])
                cursor.execute('SELECT status FROM institutions WHERE id=%s', (inst['id'],))
                old_row = cursor.fetchone()
                old_status = old_row['status'] if old_row else inst['status']

                if old_status != new_status:
                    cursor.execute('''
                        INSERT INTO status_history (institution_id, old_status, new_status, changed_by)
                        VALUES (%s,%s,%s,%s)
                    ''', (inst['id'], old_status, new_status, 'system-monitor'))

                cursor.execute('''
                    UPDATE institutions
                    SET status=%s, status_detail=%s, last_verified_at=NOW()
                    WHERE id=%s
                ''', (new_status, detail, inst['id']))
            except Exception:
                # Log per-institution failure to audit_logs for later inspection
                try:
                    tb = traceback.format_exc()
                    cursor.execute('INSERT INTO audit_logs (action, username) VALUES (%s,%s)', (f'Connectivity scan error for institution {inst["id"]}: {str(tb)[:200]}', 'system-monitor'))
                except Exception:
                    pass

        db.commit()
        db.close()
        return True
    except Exception:
        try:
            tb = traceback.format_exc()
            db = get_db()
            cursor = db.cursor()
            cursor.execute('INSERT INTO audit_logs (action, username) VALUES (%s,%s)', (f'Connectivity scan failure: {str(tb)[:200]}', 'system-monitor'))
            db.commit()
            db.close()
        except Exception:
            pass
        return False


def start_connectivity_monitor():
    def worker():
        while True:
            scan_institutions_for_connectivity()
            time.sleep(120)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()


def ensure_inventory_table():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS inventory_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                institution_id INT NULL,
                school_code VARCHAR(100) NULL,
                head_of_institution_name VARCHAR(255) NULL,
                head_of_institution_contact VARCHAR(100) NULL,
                serial_no VARCHAR(100) NULL,
                delivery_status VARCHAR(50) DEFAULT 'Pending',
                delivery_date DATE NULL,
                inspection_status VARCHAR(50) DEFAULT 'Not Taken',
                inspection_date DATE NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_inventory_institution (institution_id),
                INDEX idx_inventory_delivery (delivery_status),
                INDEX idx_inventory_inspection (inspection_status)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS equipment_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                institution_id INT NULL,
                equipment_type VARCHAR(100) NULL,
                equipment_name VARCHAR(255) NULL,
                model_oem VARCHAR(255) NULL,
                serial_no VARCHAR(100) NULL,
                quantity INT DEFAULT 1,
                status VARCHAR(50) DEFAULT 'Pending',
                notes TEXT NULL,
                installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_equipment_institution (institution_id)
            )
        ''')
        db.commit()
        db.close()
    except Exception:
        pass


def ensure_role_permissions_table():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role VARCHAR(50) NOT NULL UNIQUE,
                can_view_dashboard TINYINT(1) DEFAULT 1,
                can_view_institutions TINYINT(1) DEFAULT 1,
                can_report_issue TINYINT(1) DEFAULT 1,
                can_manage_inventory TINYINT(1) DEFAULT 0,
                can_manage_institutions TINYINT(1) DEFAULT 0,
                can_manage_users TINYINT(1) DEFAULT 0,
                can_view_reports TINYINT(1) DEFAULT 0,
                can_resolve_issues TINYINT(1) DEFAULT 0,
                can_view_audit TINYINT(1) DEFAULT 0,
                can_view_roles TINYINT(1) DEFAULT 0,
                can_view_ip_monitor TINYINT(1) DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('SHOW COLUMNS FROM role_permissions')
        existing_cols = {row['Field'] for row in cursor.fetchall()}
        if 'can_view_roles' not in existing_cols:
            cursor.execute('ALTER TABLE role_permissions ADD COLUMN can_view_roles TINYINT(1) DEFAULT 0')
        if 'can_view_ip_monitor' not in existing_cols:
            cursor.execute('ALTER TABLE role_permissions ADD COLUMN can_view_ip_monitor TINYINT(1) DEFAULT 0')
        db.commit()

        cursor.execute('SELECT role FROM role_permissions')
        existing_roles = {row['role'] for row in cursor.fetchall()}

        defaults = {
            'viewer': (1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0),
            'user': (1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0),
            'field': (1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0),
            'management': (1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0),
            'admin': (1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
        }

        for role, values in defaults.items():
            if role not in existing_roles:
                cursor.execute('''
                    INSERT INTO role_permissions (
                        role, can_view_dashboard, can_view_institutions, can_report_issue,
                        can_manage_inventory, can_manage_institutions, can_manage_users,
                        can_view_reports, can_resolve_issues, can_view_audit
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ''', (role, *values))

        db.commit()
        db.close()
    except Exception:
        pass


def get_role_permissions(role):
    try:
        role_name = (role or 'viewer').lower()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM role_permissions WHERE role=%s', (role_name,))
        row = cursor.fetchone()
        db.close()
        if not row:
            return {
                'role': role_name,
                'can_view_dashboard': True,
                'can_view_institutions': True,
                'can_report_issue': True,
                'can_manage_inventory': False,
                'can_manage_institutions': False,
                'can_manage_users': False,
                'can_view_reports': False,
                'can_resolve_issues': False,
                'can_view_audit': False,
                'can_view_roles': role_name in ('admin', 'management'),
                'can_view_ip_monitor': role_name == 'admin',
            }
        return {
            'role': row['role'],
            'can_view_dashboard': bool(row.get('can_view_dashboard')),
            'can_view_institutions': bool(row.get('can_view_institutions')),
            'can_report_issue': bool(row.get('can_report_issue')),
            'can_manage_inventory': bool(row.get('can_manage_inventory')),
            'can_manage_institutions': bool(row.get('can_manage_institutions')),
            'can_manage_users': bool(row.get('can_manage_users')),
            'can_view_reports': bool(row.get('can_view_reports')),
            'can_resolve_issues': bool(row.get('can_resolve_issues')),
            'can_view_audit': bool(row.get('can_view_audit')),
            'can_view_roles': bool(row.get('can_view_roles')) or role_name in ('admin', 'management'),
            'can_view_ip_monitor': bool(row.get('can_view_ip_monitor')) or role_name == 'admin',
        }
    except Exception:
        return {
            'role': role_name,
            'can_view_dashboard': True,
            'can_view_institutions': True,
            'can_report_issue': True,
            'can_manage_inventory': False,
            'can_manage_institutions': False,
            'can_manage_users': False,
            'can_view_reports': False,
            'can_resolve_issues': False,
            'can_view_audit': False,
            'can_view_roles': False,
            'can_view_ip_monitor': False,
        }


ensure_inventory_table()
ensure_role_permissions_table()
# Start background connectivity monitor only when explicitly enabled (safer for production)
if MONITOR_ENABLED:
    start_connectivity_monitor()


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


def permission_required(permission_name):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'error': 'Login required'}), 401
            permissions = get_role_permissions(session.get('role'))
            if not permissions.get(permission_name):
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
        'message': 'Institution Connectivity Monitoring System API v2 is running!',
        'version': '2.0.0'
    })


@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')


@app.route('/templates/dashboard.html')
def dashboard_template():
    return render_template('dashboard.html')


@app.route('/index.html')
def index_page():
    return send_file('index.html')


# -----------------------
# Security helpers
# -----------------------
def require_json(*fields):
    """Decorator to ensure request has JSON and required fields."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Expected JSON body'}), 400
            data = request.get_json() or {}
            missing = [p for p in fields if (p not in data) or (isinstance(data.get(p), str) and data.get(p).strip() == '')]
            if missing:
                return jsonify({'success': False, 'error': f"Missing fields: {', '.join(missing)}"}), 400
            return f(*args, **kwargs)
        return wrapped
    return decorator

# ================================
# SIGNUP (email/password)
# ================================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    # Signup via public endpoint is disabled. Only admins may create users via the
    # admin interface. This prevents unauthorized account creation when the app
    # is publicly hosted.
    return jsonify({'success': False, 'error': 'Sign up is disabled. Contact the administrator.'}), 403

# ================================
# LOGIN (email/password)
# ================================
@app.route('/api/auth/login', methods=['POST'])
@require_json('identifier', 'password')
def login():
    try:
        data = request.get_json()
        identifier = data.get('identifier', '').strip().lower()
        password = data.get('password', '')

        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT * FROM users
            WHERE (email=%s OR username=%s) AND status="Active"
        ''', (identifier, identifier))
        user = cursor.fetchone()
        db.close()

        if not user or not user['password_hash']:
            return jsonify({'success': False, 'error': 'Invalid login credentials'}), 401

        if user['status'] != 'Active':
            return jsonify({'success': False, 'error': 'This account is inactive or suspended'}), 403

        if not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'error': 'Invalid login credentials'}), 401

        session['user_id'] = user['id']
        session['email'] = user['email'] or user['username']
        session['name'] = user['name']
        session['role'] = user['role']
        # Respect configured session lifetime
        session.permanent = True
        # Generate CSRF token if enabled
        if ENABLE_CSRF:
            token = secrets.token_urlsafe(32)
            session['csrf_token'] = token

        log_action(f"User logged in: {identifier}", identifier)

        return jsonify({
            'success': True,
            'user': {'id': user['id'], 'name': user['name'], 'email': session['email'], 'role': user['role']}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GOOGLE OAUTH - START
# ================================
@app.route('/api/auth/google')
def google_login():
    # Google OAuth is disabled for this deployment. Use admin-created accounts.
    return jsonify({'success': False, 'error': 'Google sign-in is disabled. Contact the administrator.'}), 403

# ================================
# GOOGLE OAUTH - CALLBACK
# ================================
@app.route('/api/auth/google/callback')
def google_callback():
    # Google callback is disabled in this deployment.
    return jsonify({'success': False, 'error': 'Google sign-in is disabled. Contact the administrator.'}), 403

# ================================
# LOGOUT
# ================================
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/auth/password/reset', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        identifier = (data.get('identifier') or '').strip().lower()
        new_password = data.get('newPassword') or ''

        if not identifier or len(new_password) < 6:
            return jsonify({'success': False, 'error': 'Please provide a valid email or username and a new password'}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id FROM users WHERE (email=%s OR username=%s)', (identifier, identifier))
        user = cursor.fetchone()
        if not user:
            db.close()
            return jsonify({'success': False, 'error': 'No account found for that email or username'}), 404

        password_hash = generate_password_hash(new_password)
        cursor.execute('UPDATE users SET password_hash=%s WHERE id=%s', (password_hash, user['id']))
        db.commit()
        db.close()

        log_action(f"Password reset for {identifier}", identifier)
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
            'role': session['role'],
            'permissions': get_role_permissions(session.get('role'))
        }
    })
# ================================
# BULK INSTITUTION IMPORT (CSV)
# ================================
@app.route('/api/institutions/import', methods=['POST'])
@permission_required('can_manage_institutions')
def import_institutions():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Only CSV files are allowed for bulk import'}), 400

        raw_text = file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(raw_text))

        db = get_db()
        cursor = db.cursor()
        imported = 0
        updated = 0

        for row in reader:
            name = (row.get('name') or '').strip().upper()
            nemis = (row.get('nemis') or '').strip().upper()
            county = (row.get('county') or '').strip()
            if not name or not nemis:
                continue

            cursor.execute('SELECT id FROM institutions WHERE nemis=%s', (nemis,))
            existing = cursor.fetchone()

            if existing:
                cursor.execute('''
                    UPDATE institutions SET
                    region=%s, county=%s, sub_county=%s, constituency=%s, ward=%s, zone=%s,
                    name=%s, type=%s, category=%s, project=%s, ip_address=%s,
                    no_of_access_points=%s, status=%s, status_detail=%s, comments=%s,
                    last_verified_at=NOW()
                    WHERE id=%s
                ''', (
                    row.get('region') or 'North Rift', county,
                    (row.get('sub_county') or '').strip().upper(),
                    (row.get('constituency') or '').strip(),
                    (row.get('ward') or '').strip(),
                    (row.get('zone') or '').strip().upper(),
                    name,
                    (row.get('type') or 'Public').strip(),
                    (row.get('category') or 'School').strip(),
                    (row.get('project') or '').strip(),
                    (row.get('ip_address') or '').strip(),
                    int((row.get('no_of_access_points') or 0) or 0),
                    (row.get('status') or 'Not Connected').strip(),
                    (row.get('status_detail') or '').strip(),
                    (row.get('comments') or '').strip(),
                    existing['id']
                ))
                updated += 1
            else:
                cursor.execute('''
                    INSERT INTO institutions
                    (region, county, sub_county, constituency, ward, zone, nemis, name, type,
                    category, project, ip_address, no_of_access_points, lat, lng, status, status_detail, comments)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ''', (
                    row.get('region') or 'North Rift', county,
                    (row.get('sub_county') or '').strip().upper(),
                    (row.get('constituency') or '').strip(),
                    (row.get('ward') or '').strip(),
                    (row.get('zone') or '').strip().upper(),
                    nemis, name,
                    (row.get('type') or 'Public').strip(),
                    (row.get('category') or 'School').strip(),
                    (row.get('project') or '').strip(),
                    (row.get('ip_address') or '').strip(),
                    int((row.get('no_of_access_points') or 0) or 0),
                    float(row.get('lat') or 0) if row.get('lat') else None,
                    float(row.get('lng') or 0) if row.get('lng') else None,
                    (row.get('status') or 'Not Connected').strip(),
                    (row.get('status_detail') or '').strip(),
                    (row.get('comments') or '').strip()
                ))
                imported += 1

        db.commit()
        db.close()
        return jsonify({
            'success': True,
            'message': 'Bulk institution import completed',
            'imported': imported,
            'updated': updated
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/institutions/monitor', methods=['POST'])
@permission_required('can_view_ip_monitor')
def run_institution_monitor():
    try:
        success = scan_institutions_for_connectivity()
        if not success:
            return jsonify({'success': False, 'error': 'Monitoring scan failed'}), 500
        return jsonify({'success': True, 'message': 'Institution connectivity scan completed'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/institutions/ip-status', methods=['GET'])
@permission_required('can_view_ip_monitor')
def get_ip_status_monitor():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT id, name, county, sub_county, ip_address, status, status_detail, last_verified_at
            FROM institutions
            WHERE ip_address IS NOT NULL AND TRIM(ip_address) <> ''
            ORDER BY county, name
        ''')
        institutions = cursor.fetchall()
        for inst in institutions:
            if inst.get('last_verified_at') and hasattr(inst['last_verified_at'], 'isoformat'):
                inst['last_verified_at'] = inst['last_verified_at'].isoformat()
        db.close()
        return jsonify({'success': True, 'data': institutions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GET ALL INSTITUTIONS
# ================================
@app.route('/api/institutions', methods=['GET'])
@permission_required('can_view_institutions')
def get_institutions():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM institutions ORDER BY id')
        institutions = cursor.fetchall()
        # Convert datetime fields to ISO strings for reliable client parsing
        for inst in institutions:
            if inst.get('last_verified_at') and hasattr(inst['last_verified_at'], 'isoformat'):
                inst['last_verified_at'] = inst['last_verified_at'].isoformat()
            if inst.get('created_at') and hasattr(inst['created_at'], 'isoformat'):
                inst['created_at'] = inst['created_at'].isoformat()
        db.close()
        return jsonify({'success': True, 'data': institutions, 'total': len(institutions)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ================================
# GET ONE INSTITUTION (with history + issues + files)
# ================================
@app.route('/api/institutions/<int:id>', methods=['GET'])
@permission_required('can_view_institutions')
def get_institution(id):
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute('SELECT * FROM institutions WHERE id=%s', (id,))
        institution = cursor.fetchone()
        if not institution:
            db.close()
            return jsonify({'success': False, 'error': 'Institution not found'}), 404

        # Perform an immediate connectivity check for this institution so the
        # UI shows up-to-date status when someone views the profile.
        if institution.get('ip_address'):
            try:
                new_status, detail = check_ip_connectivity(institution['ip_address'])
                cursor.execute('SELECT status FROM institutions WHERE id=%s', (id,))
                old_row = cursor.fetchone()
                old_status = old_row['status'] if old_row else institution['status']
                if old_status != new_status:
                    cursor.execute('INSERT INTO status_history (institution_id, old_status, new_status, changed_by) VALUES (%s,%s,%s,%s)', (id, old_status, new_status, session.get('email') or 'viewer'))
                cursor.execute('UPDATE institutions SET status=%s, status_detail=%s, last_verified_at=NOW() WHERE id=%s', (new_status, detail, id))
                db.commit()
                # refresh institution object
                cursor.execute('SELECT * FROM institutions WHERE id=%s', (id,))
                institution = cursor.fetchone()
                # convert datetime to ISO for client
                if institution.get('last_verified_at') and hasattr(institution['last_verified_at'], 'isoformat'):
                    institution['last_verified_at'] = institution['last_verified_at'].isoformat()
            except Exception:
                # don't fail profile load on scan errors; log and continue
                try:
                    tb = traceback.format_exc()
                    cursor.execute('INSERT INTO audit_logs (action, username) VALUES (%s,%s)', (f'On-demand scan error for institution {id}: {str(tb)[:200]}', session.get('email') or 'system'))
                    db.commit()
                except Exception:
                    pass

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
@permission_required('can_manage_institutions')
@require_json('name')
def add_institution():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO institutions
            (region, county, sub_county, constituency, ward, zone, nemis, name, type,
            category, project, ip_address, no_of_access_points,
            lat, lng, status, status_detail, comments)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (
            data.get('region', 'North Rift'), data.get('county'),
            data.get('subCounty'), data.get('constituency'), data.get('ward'),
            data.get('zone'), data.get('nemis'),
            data.get('name'), data.get('type', 'PUBLIC'),
            data.get('category'), data.get('project'),
            data.get('ipAddress'), data.get('noOfAccessPoints', 0),
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
@permission_required('can_manage_institutions')
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
            region=%s, county=%s, sub_county=%s, constituency=%s, ward=%s, zone=%s, nemis=%s,
            name=%s, type=%s, category=%s, project=%s, ip_address=%s, no_of_access_points=%s,
            lat=%s, lng=%s, status=%s,
            status_detail=%s, comments=%s, last_verified_at=NOW()
            WHERE id=%s
        ''', (
            data.get('region', 'North Rift'), data.get('county'),
            data.get('subCounty'), data.get('constituency'), data.get('ward'), data.get('zone'), data.get('nemis'),
            data.get('name'), data.get('type'), data.get('category'), data.get('project'),
            data.get('ipAddress'), data.get('noOfAccessPoints', 0),
            data.get('lat'), data.get('lng'),
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
@permission_required('can_view_dashboard')
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
@permission_required('can_report_issue')
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
@permission_required('can_resolve_issues')
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
@role_required('admin', 'user', 'management')
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
        role = (data.get('role', 'viewer') or 'viewer').lower()
        status = (data.get('status') or 'Active').strip()

        if role not in ('admin', 'management', 'user', 'field', 'viewer'):
             return jsonify({'success': False, 'error': 'Invalid role'}), 400

        if status not in ('Active', 'Inactive', 'Suspended'):
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
            return jsonify({'success': False, 'error': 'Invalid role'}), 400

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
            VALUES (%s,%s,%s,'email',%s,%s)
        ''', (name, email, password_hash, role, status))
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
        new_role = (data.get('role') or 'viewer').lower()

        if new_role not in ('admin', 'management', 'user', 'field', 'viewer'):
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


@app.route('/api/users/<int:id>/status', methods=['PUT'])
@role_required('admin')
def change_user_status(id):
    try:
        data = request.get_json()
        new_status = (data.get('status') or 'Active').strip()

        if new_status not in ('Active', 'Inactive', 'Suspended'):
            return jsonify({'success': False, 'error': 'Invalid status'}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute('UPDATE users SET status=%s WHERE id=%s', (new_status, id))
        db.commit()
        db.close()

        log_action(f"Admin changed status of user #{id} to {new_status}", session['email'])

        return jsonify({'success': True, 'message': 'User status updated'})
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
@app.route('/api/roles', methods=['GET'])
@permission_required('can_view_roles')
def get_roles_config():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM role_permissions ORDER BY role')
        roles = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': roles})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/logs', methods=['GET'])
@permission_required('can_view_audit')
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


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT id, action, username, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10')
        notes = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': notes})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# -----------------------
# Security helpers
# -----------------------
def require_json(*fields):
    """Decorator to ensure request has JSON and required fields."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Expected JSON body'}), 400
            data = request.get_json() or {}
            missing = [p for p in fields if (p not in data) or (isinstance(data.get(p), str) and data.get(p).strip() == '')]
            if missing:
                return jsonify({'success': False, 'error': f"Missing fields: {', '.join(missing)}"}), 400
            return f(*args, **kwargs)
        return wrapped
    return decorator

@app.after_request
def set_security_headers(response):
    # Basic security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    # Content Security Policy — conservative default, allows scripts/styles from same origin
    csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    response.headers['Content-Security-Policy'] = csp
    return response


@app.before_request
def enforce_https_and_csrf():
    # Enforce HTTPS when configured (useful behind proxies/load balancers)
    if FORCE_HTTPS:
        proto = request.headers.get('X-Forwarded-Proto', 'http')
        if proto != 'https' and not request.is_secure:
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)

    # Optional CSRF protection for session-authenticated actions
    if ENABLE_CSRF and request.method in ('POST', 'PUT', 'DELETE'):
        # Only enforce for endpoints where a session exists
        if 'user_id' in session:
            token = session.get('csrf_token')
            header = request.headers.get('X-CSRF-Token') or request.args.get('csrf_token')
            if not token or not header or header != token:
                return jsonify({'success': False, 'error': 'Missing or invalid CSRF token'}), 403

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


@app.route('/health', methods=['GET'])
def health():
    """Simple health check for load balancers and monitoring.
    Returns OK and verifies a simple DB connection.
    """
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT 1')
        db.close()
        return jsonify({'status': 'ok', 'db': 'ok'}), 200
    except Exception as e:
        app.logger.exception('Health check failed')
        return jsonify({'status': 'error', 'db': str(e)}), 500

# ================================
# RUN APP
# ================================

# ================================
# INVENTORY RECORDS (User + Admin can manage)
# ================================
@app.route('/api/inventory', methods=['GET'])
@login_required
def get_inventory():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT ir.*, inst.name AS institution_name, inst.nemis AS institution_nemis
            FROM inventory_records ir
            LEFT JOIN institutions inst ON ir.institution_id = inst.id
            ORDER BY ir.created_at DESC
        ''')
        inventory = cursor.fetchall()

        for row in inventory:
            equipment_row = None
            cursor.execute('''
                SELECT equipment_type, equipment_name, model_oem, serial_no, quantity, status, notes
                FROM equipment_inventory
                WHERE institution_id=%s
                ORDER BY installed_at DESC
                LIMIT 1
            ''', (row.get('institution_id'),))
            equipment_row = cursor.fetchone()
            if equipment_row:
                row['equipment_type'] = equipment_row.get('equipment_type')
                row['equipment_name'] = equipment_row.get('equipment_name')
                row['model_oem'] = equipment_row.get('model_oem')
                row['equipment_serial_no'] = equipment_row.get('serial_no')
                row['equipment_quantity'] = equipment_row.get('quantity')
                row['equipment_status'] = equipment_row.get('status')
                row['equipment_notes'] = equipment_row.get('notes')
            else:
                row['equipment_type'] = None
                row['equipment_name'] = None
                row['model_oem'] = None
                row['equipment_serial_no'] = None
                row['equipment_quantity'] = 1
                row['equipment_status'] = 'Pending'
                row['equipment_notes'] = None

        db.close()
        return jsonify({'success': True, 'data': inventory})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/inventory', methods=['POST'])
@permission_required('can_manage_inventory')
def add_inventory_record():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO inventory_records (
                institution_id, school_code, head_of_institution_name,
                head_of_institution_contact, serial_no, delivery_status,
                delivery_date, inspection_status, inspection_date
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (
            data.get('institutionId') or None,
            data.get('schoolCode') or None,
            data.get('headOfInstitutionName') or None,
            data.get('headOfInstitutionContact') or None,
            data.get('serialNo') or None,
            data.get('deliveryStatus') or 'Pending',
            data.get('deliveryDate') or None,
            data.get('inspectionStatus') or 'Not Taken',
            data.get('inspectionDate') or None
        ))
        new_id = cursor.lastrowid

        equipment_type = data.get('equipmentType') or ''
        equipment_name = data.get('equipmentName') or ''
        equipment_model = data.get('equipmentModel') or ''
        equipment_serial = data.get('equipmentSerial') or ''
        equipment_quantity = data.get('equipmentQuantity') or 1
        equipment_status = data.get('equipmentStatus') or 'Pending'
        equipment_notes = data.get('equipmentNotes') or ''
        if data.get('institutionId') and (equipment_type or equipment_name or equipment_model or equipment_serial or equipment_notes):
            cursor.execute('''
                INSERT INTO equipment_inventory
                (institution_id, equipment_type, equipment_name, model_oem, serial_no, quantity, status, notes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ''', (
                data.get('institutionId'), equipment_type, equipment_name, equipment_model, equipment_serial, equipment_quantity, equipment_status, equipment_notes
            ))

        db.commit()
        db.close()

        log_action('Added inventory record', session['email'])
        return jsonify({'success': True, 'message': 'Inventory record added', 'id': new_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/inventory/<int:id>', methods=['PUT'])
@permission_required('can_manage_inventory')
def update_inventory_record(id):
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            UPDATE inventory_records SET
                institution_id=%s,
                school_code=%s,
                head_of_institution_name=%s,
                head_of_institution_contact=%s,
                serial_no=%s,
                delivery_status=%s,
                delivery_date=%s,
                inspection_status=%s,
                inspection_date=%s
            WHERE id=%s
        ''', (
            data.get('institutionId') or None,
            data.get('schoolCode') or None,
            data.get('headOfInstitutionName') or None,
            data.get('headOfInstitutionContact') or None,
            data.get('serialNo') or None,
            data.get('deliveryStatus') or 'Pending',
            data.get('deliveryDate') or None,
            data.get('inspectionStatus') or 'Not Taken',
            data.get('inspectionDate') or None,
            id
        ))
        db.commit()
        db.close()

        log_action(f'Updated inventory record #{id}', session['email'])
        return jsonify({'success': True, 'message': 'Inventory record updated'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/inventory/<int:id>', methods=['DELETE'])
@permission_required('can_manage_inventory')
def delete_inventory_record(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM inventory_records WHERE id=%s', (id,))
        db.commit()
        db.close()

        log_action(f'Removed inventory record #{id}', session['email'])
        return jsonify({'success': True, 'message': 'Inventory record removed'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ================================
# EQUIPMENT INVENTORY (User + Admin can manage)
# ================================
@app.route('/api/equipment/<int:institution_id>', methods=['GET'])
@login_required
def get_equipment(institution_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'SELECT * FROM equipment_inventory WHERE institution_id=%s ORDER BY installed_at DESC',
            (institution_id,)
        )
        equipment = cursor.fetchall()
        db.close()
        return jsonify({'success': True, 'data': equipment})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/equipment', methods=['POST'])
@permission_required('can_manage_inventory')
def add_equipment():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO equipment_inventory
            (institution_id, equipment_type, model_oem, serial_no, notes)
            VALUES (%s,%s,%s,%s,%s)
        ''', (
            data.get('institutionId'), data.get('equipmentType'),
            data.get('modelOem'), data.get('serialNo'), data.get('notes')
        ))
        db.commit()
        new_id = cursor.lastrowid
        db.close()

        log_action(f"Added equipment: {data.get('equipmentType')} to institution #{data.get('institutionId')}", session['email'])

        return jsonify({'success': True, 'message': 'Equipment added', 'id': new_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/equipment/<int:id>', methods=['DELETE'])
@role_required('admin', 'user', 'field', 'management')
def delete_equipment(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('DELETE FROM equipment_inventory WHERE id=%s', (id,))
        db.commit()
        db.close()
        log_action(f"Removed equipment #{id}", session['email'])
        return jsonify({'success': True, 'message': 'Equipment removed'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    port = int(os.getenv('PORT', '5000'))
    if not debug_mode:
        app.logger.info('Starting app in production mode')
    else:
        app.logger.info('Starting app in debug mode')
    app.run(debug=debug_mode, port=port)
    