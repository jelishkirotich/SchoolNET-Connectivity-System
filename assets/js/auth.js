// ================================
// AUTH JS
// ================================

// Users list
const USERS_AUTH = [
    { username: 'admin', password: 'admin123', role: 'Super Admin' },
    { username: 'officer', password: 'officer123', role: 'Editor' },
    { username: 'viewer', password: 'viewer123', role: 'Viewer' }
];

// Handle login form
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Check empty fields
    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Find user
    const user = USERS_AUTH.find(
        u => u.username === username && u.password === password
    );

    if (user) {
        // Save login state
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('role', user.role);

        // Go to dashboard
        window.location.href = 'index.html';
    } else {
        showError('Wrong username or password');
    }
});

// Show error message
function showError(msg) {
    let error = document.getElementById('loginError');
    if (!error) {
        error = document.createElement('div');
        error.id = 'loginError';
        error.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 13px;
            margin-top: 12px;
            text-align: center;
        `;
        document.getElementById('loginForm').appendChild(error);
    }
    error.textContent = msg;
}