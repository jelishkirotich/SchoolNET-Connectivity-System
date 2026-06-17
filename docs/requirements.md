# SchoolNET System Requirements

## Project Overview
Web-based management system for tracking internet 
connectivity of Junior Secondary Schools in 
North Rift Region, Kenya.

## Functional Requirements

### Authentication
- User login with username and password
- Session management
- Role-based access control
- Secure logout

### School Registry
- View all 1,457 schools
- Add new school
- Edit school details
- Delete school
- Search by name or NEMIS code
- Filter by county and status
- Export to CSV
- Upload documents and images

### GIS Mapping
- Interactive map using Leaflet.js
- Color-coded markers by connectivity status
- Filter by county, sub-county, status
- Click marker to view school details
- Link to school profile from map

### Reports & Analytics
- Summary statistics dashboard
- County-by-county breakdown
- Connectivity coverage percentage
- Progress bars per county
- Export to CSV

### Administration
- User management (add, view users)
- Role and permissions management
- Audit log of all system actions
- System information panel

## Non-Functional Requirements
- Works on all modern browsers
- Responsive design for mobile
- Fast loading times
- Secure authentication
- Data stored in MySQL database
- REST API backend with Flask

## Technology Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Python Flask
- Database: MySQL
- Maps: Leaflet.js
- Version Control: Git and GitHub
- Hosting: GitHub Pages (frontend)

## User Roles
| Role | Permissions |
|------|------------|
| Super Admin | Full access |
| Editor | Add and edit schools |
| Viewer | Read only |
| Field Agent | Update connectivity status |