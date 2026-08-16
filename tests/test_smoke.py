import os
import requests

BASE = os.getenv('APP_BASE', 'http://127.0.0.1:5000')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'adminpass')


def test_health():
    r = requests.get(f'{BASE}/health', timeout=5)
    assert r.status_code == 200
    d = r.json()
    assert d.get('status') == 'ok'


def test_login():
    payload = {'identifier': ADMIN_EMAIL, 'password': ADMIN_PASSWORD}
    r = requests.post(f'{BASE}/api/auth/login', json=payload, timeout=5)
    assert r.status_code == 200
    d = r.json()
    assert d.get('success') is True
