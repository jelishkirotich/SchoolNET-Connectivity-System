# 🌐 SchoolNET Connectivity Management System

A web-based system for tracking and monitoring internet 
connectivity of Junior Secondary Schools in the 
North Rift Region of Kenya.

## 🔗 Live Demo
https://jelishkirotich.github.io/SchoolNET-Connectivity-System/

## 🔑 Login Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Admin |
| officer | officer123 | Editor |
| viewer | viewer123 | Viewer |

## 📋 Features
- 🔐 Secure login and authentication
- 📊 Dashboard with live statistics
- 🏫 School Registry — 1,457 institutions
- 🗺️ Interactive GIS Map (Leaflet.js)
- 📄 Reports and CSV export
- 📁 File upload system
- 👤 User management
- 📋 Audit logging

## 🗺️ Region Coverage
| County | Schools |
|--------|---------|
| Nandi | 302 |
| Baringo | 251 |
| West Pokot | 218 |
| Uasin Gishu | 215 |
| Trans Nzoia | 178 |
| Elgeyo Marakwet | 176 |
| Turkana | 117 |

## 🛠️ Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python Flask |
| Database | MySQL |
| Maps | Leaflet.js |
| Version Control | Git and GitHub |
| Hosting | GitHub Pages |

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/jelishkirotich/SchoolNET-Connectivity-System.git
```

### 2. Install Python dependencies
```bash
pip install flask flask-cors pymysql
```

### 3. Set up MySQL database
Run `schoolnet_database.sql` in MySQL Workbench

### 4. Start Flask backend
```bash
python app.py
```

### 5. Open the frontend
Open `index.html` with Live Server

## 👤 Author
**jelishkirotich**
GitHub: https://github.com/jelishkirotich