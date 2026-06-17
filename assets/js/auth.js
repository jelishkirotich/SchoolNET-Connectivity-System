// ================================
// AUTH JS
// ================================

async function doLogin() {
    const u = document.getElementById('loginUser')
        .value.trim();
    const p = document.getElementById('loginPass')
        .value.trim();
    const err = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    err.style.display = 'none';

    if (!u || !p) {
        err.textContent = 'Please fill in all fields';
        err.style.display = 'block';
        return;
    }

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const result = await apiLogin(u, p);

    if (result.success) {
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('username', result.user.username);
        sessionStorage.setItem('role', result.user.role);
        sessionStorage.setItem('name', result.user.name);
        window.location.href = 'pages/dashboard.html';
    } else {
        err.textContent = result.error ||
            'Wrong username or password';
        err.style.display = 'block';
        btn.textContent = 'Login';
        btn.disabled = false;
    }
}

// Toggle password visibility
function togglePassword() {
    const input = document.getElementById('loginPass');
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Enter key to login
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
});