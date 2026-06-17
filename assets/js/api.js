// ================================
// API — Connects to Flask Backend
// ================================

const API_URL = 'http://127.0.0.1:5000';

// GET ALL SCHOOLS
async function fetchSchools() {
    try {
        const res = await fetch(`${API_URL}/api/schools`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch(e) {
        console.error('fetchSchools error:', e);
        return [];
    }
}

// GET STATS
async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        return data.success ? data.data : null;
    } catch(e) {
        console.error('fetchStats error:', e);
        return null;
    }
}

// ADD SCHOOL
async function apiAddSchool(data) {
    try {
        const res = await fetch(`${API_URL}/api/schools`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch(e) {
        return {success: false, error: e.message};
    }
}

// UPDATE SCHOOL
async function apiUpdateSchool(id, data) {
    try {
        const res = await fetch(
            `${API_URL}/api/schools/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch(e) {
        return {success: false, error: e.message};
    }
}

// DELETE SCHOOL
async function apiDeleteSchool(id) {
    try {
        const res = await fetch(
            `${API_URL}/api/schools/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch(e) {
        return {success: false, error: e.message};
    }
}

// LOGIN
async function apiLogin(username, password) {
    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        return await res.json();
    } catch(e) {
        return {success: false, error: 'Cannot connect to server. Make sure Flask is running!'};
    }
}

// GET USERS
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/api/users`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch(e) {
        return [];
    }
}

// ADD USER
async function apiAddUser(data) {
    try {
        const res = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch(e) {
        return {success: false, error: e.message};
    }
}

// GET LOGS
async function fetchLogs() {
    try {
        const res = await fetch(`${API_URL}/api/logs`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch(e) {
        return [];
    }
}