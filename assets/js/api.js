// ================================
// API CONNECTION
// Connects frontend to Flask backend
// ================================

const API_URL = 'http://127.0.0.1:5000';

// ================================
// GET ALL SCHOOLS
// ================================
async function fetchSchools() {
    try {
        const response = await fetch(`${API_URL}/api/schools`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching schools:', error);
        return [];
    }
}

// ================================
// GET STATS
// ================================
async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

// ================================
// ADD SCHOOL
// ================================
async function apiAddSchool(data) {
    try {
        const response = await fetch(`${API_URL}/api/schools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding school:', error);
        return { success: false, error: error.message };
    }
}

// ================================
// UPDATE SCHOOL
// ================================
async function apiUpdateSchool(id, data) {
    try {
        const response = await fetch(
            `${API_URL}/api/schools/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating school:', error);
        return { success: false, error: error.message };
    }
}

// ================================
// DELETE SCHOOL
// ================================
async function apiDeleteSchool(id) {
    try {
        const response = await fetch(
            `${API_URL}/api/schools/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting school:', error);
        return { success: false, error: error.message };
    }
}

// ================================
// LOGIN
// ================================
async function apiLogin(username, password) {
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Error logging in:', error);
        return { success: false, error: error.message };
    }
}

// ================================
// GET USERS
// ================================
async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// ================================
// ADD USER
// ================================
async function apiAddUser(data) {
    try {
        const response = await fetch(`${API_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding user:', error);
        return { success: false, error: error.message };
    }
}

// ================================
// GET AUDIT LOGS
// ================================
async function fetchLogs() {
    try {
        const response = await fetch(`${API_URL}/api/logs`);
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
}