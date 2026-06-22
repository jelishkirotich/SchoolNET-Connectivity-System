// ================================
// API — Connects to Flask Backend
// ================================

const API_URL = 'http://127.0.0.1:5000';

async function apiGet(path) {
    try {
        const res = await fetch(`${API_URL}${path}`, { credentials: 'include' });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Cannot connect to server. Make sure Flask is running.' };
    }
}

async function apiPost(path, body) {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Cannot connect to server. Make sure Flask is running.' };
    }
}

async function apiPut(path, body) {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function apiDelete(path) {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function apiUploadFile(formData) {
    try {
        const res = await fetch(`${API_URL}/api/files/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show';
    if (type) t.classList.add(type);
    setTimeout(() => { t.className = ''; }, 3000);
}