# Institution Connectivity Monitoring System

## Overview
The Institution Connectivity Monitoring System is a web-based monitoring and administration platform for tracking connectivity across institutions such as schools, universities, hospitals, government offices, and police stations. The system supports institution registration, status tracking, issue reporting, inventory management, role-based user access, and live connectivity verification.

## Main Purpose
The platform is designed to help administrators and operations teams monitor whether institutions are connected, scheduled for connectivity, or not connected. It also provides a structured way to manage institution records, upload documents, record issues, and maintain audit trails.

## Core Features

### 1. Institution Registry
- Store institution details such as name, NEMIS, county, sub-county, zone, type, and category.
- Support multiple institution categories, including:
  - School
  - University
  - Hospital
  - Government Office
  - Police Station

### 2. Connectivity Monitoring
- Institutional IP addresses are tracked and reviewed for status.
- Monitoring can be triggered manually and can also be automated for periodic checks.
- Connectivity history is stored for audit and visibility.

### 3. Dashboard and Reporting
- Executive-style dashboard with statistical summaries.
- County-wise institution coverage presentation.
- Recent institution activity and reporting views.

### 4. File Upload and Bulk Import
- Upload supporting documents and attachments per institution.
- Import institutions in bulk using CSV files.
- Export institution data for review or reporting.

### 5. Role-Based Access Control
The system separates access by role:
- Admin
- Management
- Field Staff
- User
- Viewer

Admin-level users control system governance, user management, audit visibility, reports, and the IP connectivity monitoring page.

## Key Backend Components
The system is built mainly around Flask and Python and uses MySQL for persistence.

### Backend areas include:
- Authentication and session management
- Role and permission enforcement
- Institution CRUD operations
- Monitoring routines
- CSV import and export
- Audit logging
- Issue reporting and file handling

## Main Frontend Pages
The dashboard interface provides the following sections:
- Dashboard
- Inventory
- Institutions Registry
- GIS Map
- Issue Reports
- Reports
- Roles & Permissions
- User Management
- Audit Log
- IP Connectivity Status (admin only)

## Admin Controls
Admin users can manage:
- user accounts
- role permissions
- institution-wide monitoring
- system audit records
- reports and analytics

## Security Model
The platform uses server-side role checks to control access to sensitive operations. The UI also hides admin-only sections for non-admin users, but the real enforcement is performed in the backend.

## Recommended Usage
1. Log in using a user account.
2. Add or import institutions.
3. Assign connectivity details such as IP address and status.
4. Trigger monitoring to refresh connectivity status.
5. Review reports, issues, and audit activity.

## Project Status
This implementation currently focuses on:
- institution-wide branding
- broader institution category support
- admin-only monitoring visibility
- live monitoring workflow
- CSV bulk import support

## Note on Folder Name
The workspace folder has been rebranded in project intent to the new institutional naming, but a direct filesystem rename is currently blocked while the folder remains actively in use by the current VS Code session and terminal context.
