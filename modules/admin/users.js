// ================================
// ADMIN USERS MODULE
// ================================

function validateUser(name, username, password) {
    if (!name || !username || !password) {
        return {
            valid: false,
            message: 'All fields are required'
        };
    }
    if (username.length < 3) {
        return {
            valid: false,
            message: 'Username must be at least 3 characters'
        };
    }
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Password must be at least 6 characters'
        };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            valid: false,
            message: 'Username can only contain letters, numbers and underscores'
        };
    }
    return { valid: true };
}

function formatUserRole(role) {
    const roles = {
        'Super Admin': '👑 Super Admin',
        'Editor':      '✏️ Editor',
        'Viewer':      '👁️ Viewer',
        'Field Agent': '🏃 Field Agent'
    };
    return roles[role] || role;
}