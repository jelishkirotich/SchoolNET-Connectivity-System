// ================================
// AUTH JS
// ================================

const USERS_AUTH = [
    { username: 'admin', password: 'admin123', role: 'Super Admin' },
    { username: 'officer', password: 'officer123', role: 'Editor' },
    { username: 'viewer', password: 'viewer123', role: 'Viewer' }
];

function doLogin() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('loginError');

    if (!u || !p) {
        err.textContent = 'Please fill in all fields';
        err.style.display = 'block';
        return;
    }

    const user = USERS_AUTH.find(
        x => x.username === u && x.password === p
    );

    if (user) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('role', user.role);
        // Go to dashboard
        window.location.href = 'pages/dashboard.html';
    } else {
        err.textContent = 'Wrong username or password';
        err.style.display = 'block';
    }
}

// Login on Enter key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
});