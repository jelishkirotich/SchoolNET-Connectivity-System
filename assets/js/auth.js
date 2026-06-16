// ================================
// AUTH JS — Connected to Flask
// ================================

async function doLogin() {
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('loginError');

    if (!u || !p) {
        err.textContent = 'Please fill in all fields';
        err.style.display = 'block';
        return;
    }

    // Show loading
    const btn = document.querySelector('.btn-login');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    // Call Flask API
    const result = await apiLogin(u, p);

    if (result.success) {
        // Save user info
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', result.user.username);
        sessionStorage.setItem('role', result.user.role);
        sessionStorage.setItem('name', result.user.name);

        // Go to dashboard
        window.location.href = 'pages/dashboard.html';
    } else {
        err.textContent = result.error ||
            'Wrong username or password';
        err.style.display = 'block';
        btn.textContent = 'Login to System';
        btn.disabled = false;
    }
}

// Login on Enter key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
});