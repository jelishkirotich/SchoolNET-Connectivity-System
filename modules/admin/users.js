// Admin Users Module
function validateUser(name, username, password) {
    if (!name || !username || !password) {
        return { valid: false, message: 'All fields are required' };
    }
    if (username.length < 3) {
        return { valid: false, message: 'Username too short' };
    }
    if (password.length < 6) {
        return { valid: false, message: 'Password must be 6+ characters' };
    }
    return { valid: true };
}