# Institution Connectivity Monitoring System

Development notes and quick start.

Prerequisites

- Python 3.11+
- MySQL running (or use docker-compose)

Setup (local)

1. Create a virtualenv and activate it.
2. pip install -r requirements.txt
3. Copy `.env.example` to `.env` and set `MYSQL_PASSWORD`, `FLASK_SECRET_KEY`, and Google OAuth if needed.
4. Initialize the database schema (run your SQL migrations).
5. seed admin: `python seed_admin.py`
6. Run: `python app.py`

Docker

- Build and run with `docker compose up --build`

Production

- Use Gunicorn + Nginx on Linux, or Waitress on Windows. Secure with HTTPS.
