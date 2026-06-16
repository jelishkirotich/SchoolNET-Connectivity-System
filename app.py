# ================================
# SCHOOLNET FLASK BACKEND
# ================================

from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql

app = Flask(__name__)
CORS(app)

# ================================
# DATABASE CONNECTION
# ================================
def get_db():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='gloriajelimo6611',
        database='schoolnet',
        cursorclass=pymysql.cursors.DictCursor
    )

# ================================
# TEST ROUTE
# ================================
@app.route('/')
def home():
    return jsonify({
        'message': 'SchoolNET API is running!',
        'version': '1.0.0'
    })

# ================================
# GET ALL SCHOOLS
# ================================
@app.route('/api/schools', methods=['GET'])
def get_schools():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM schools ORDER BY id')
        schools = cursor.fetchall()
        db.close()
        return jsonify({
            'success': True,
            'data': schools,
            'total': len(schools)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# GET ONE SCHOOL
# ================================
@app.route('/api/schools/<int:id>', methods=['GET'])
def get_school(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'SELECT * FROM schools WHERE id = %s', (id,)
        )
        school = cursor.fetchone()
        db.close()
        if school:
            return jsonify({
                'success': True,
                'data': school
            })
        return jsonify({
            'success': False,
            'error': 'School not found'
        }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# ADD SCHOOL
# ================================
@app.route('/api/schools', methods=['POST'])
def add_school():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO schools
            (region, county, sub_county, zone, nemis,
            name, type, lat, lng, status,
            status_detail, comments)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ''', (
            data.get('region', 'North Rift'),
            data.get('county'),
            data.get('subCounty'),
            data.get('zone'),
            data.get('nemis'),
            data.get('name'),
            data.get('type', 'PUBLIC'),
            data.get('lat'),
            data.get('lng'),
            data.get('status'),
            data.get('statusDetail'),
            data.get('comments')
        ))
        db.commit()
        log_action(
            f"Added school: {data.get('name')}",
            'admin'
        )
        new_id = cursor.lastrowid
        db.close()
        return jsonify({
            'success': True,
            'message': 'School added successfully',
            'id': new_id
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# UPDATE SCHOOL
# ================================
@app.route('/api/schools/<int:id>', methods=['PUT'])
def update_school(id):
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            UPDATE schools SET
            region=%s, county=%s, sub_county=%s,
            zone=%s, nemis=%s, name=%s, type=%s,
            lat=%s, lng=%s, status=%s,
            status_detail=%s, comments=%s
            WHERE id=%s
        ''', (
            data.get('region', 'North Rift'),
            data.get('county'),
            data.get('subCounty'),
            data.get('zone'),
            data.get('nemis'),
            data.get('name'),
            data.get('type'),
            data.get('lat'),
            data.get('lng'),
            data.get('status'),
            data.get('statusDetail'),
            data.get('comments'),
            id
        ))
        db.commit()
        log_action(
            f"Updated school: {data.get('name')}",
            'admin'
        )
        db.close()
        return jsonify({
            'success': True,
            'message': 'School updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# DELETE SCHOOL
# ================================
@app.route('/api/schools/<int:id>', methods=['DELETE'])
def delete_school(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'SELECT name FROM schools WHERE id=%s', (id,)
        )
        school = cursor.fetchone()
        cursor.execute(
            'DELETE FROM schools WHERE id=%s', (id,)
        )
        db.commit()
        if school:
            log_action(
                f"Deleted school: {school['name']}",
                'admin'
            )
        db.close()
        return jsonify({
            'success': True,
            'message': 'School deleted successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# LOGIN
# ================================
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT * FROM users
            WHERE username=%s
            AND password=%s
            AND status='Active'
        ''', (username, password))
        user = cursor.fetchone()
        db.close()
        if user:
            log_action(
                f"User logged in: {username}",
                username
            )
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'username': user['username'],
                    'role': user['role']
                }
            })
        return jsonify({
            'success': False,
            'error': 'Wrong username or password'
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# GET USERS
# ================================
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'SELECT id,name,username,role,status FROM users'
        )
        users = cursor.fetchall()
        db.close()
        return jsonify({
            'success': True,
            'data': users
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# ADD USER
# ================================
@app.route('/api/users', methods=['POST'])
def add_user():
    try:
        data = request.get_json()
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            INSERT INTO users
            (name, username, password, role, status)
            VALUES (%s,%s,%s,%s,%s)
        ''', (
            data.get('name'),
            data.get('username'),
            data.get('password'),
            data.get('role'),
            data.get('status', 'Active')
        ))
        db.commit()
        log_action(
            f"Added user: {data.get('name')}",
            'admin'
        )
        db.close()
        return jsonify({
            'success': True,
            'message': 'User added successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# GET STATS
# ================================
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        db = get_db()
        cursor = db.cursor()

        cursor.execute(
            'SELECT COUNT(*) as total FROM schools'
        )
        total = cursor.fetchone()['total']

        cursor.execute('''
            SELECT COUNT(*) as total FROM schools
            WHERE status="Connected"
        ''')
        connected = cursor.fetchone()['total']

        cursor.execute('''
            SELECT COUNT(*) as total FROM schools
            WHERE status="Scheduled"
        ''')
        scheduled = cursor.fetchone()['total']

        cursor.execute('''
            SELECT COUNT(*) as total FROM schools
            WHERE status="Not Connected"
        ''')
        not_connected = cursor.fetchone()['total']

        cursor.execute('''
            SELECT county,
            COUNT(*) as total,
            SUM(status="Connected") as connected,
            SUM(status="Scheduled") as scheduled,
            SUM(status="Not Connected") as not_connected
            FROM schools
            GROUP BY county
            ORDER BY total DESC
        ''')
        by_county = cursor.fetchall()

        db.close()
        return jsonify({
            'success': True,
            'data': {
                'total': total,
                'connected': connected,
                'scheduled': scheduled,
                'not_connected': not_connected,
                'by_county': by_county
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# GET AUDIT LOGS
# ================================
@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT * FROM audit_logs
            ORDER BY created_at DESC
            LIMIT 20
        ''')
        logs = cursor.fetchall()
        db.close()
        return jsonify({
            'success': True,
            'data': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ================================
# HELPER — LOG ACTION
# ================================
def log_action(action, username):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            '''INSERT INTO audit_logs
            (action, username) VALUES (%s,%s)''',
            (action, username)
        )
        db.commit()
        db.close()
    except:
        pass

# ================================
# RUN APP
# ================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)