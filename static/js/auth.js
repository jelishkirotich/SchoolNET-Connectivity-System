// ================================
// AUTH JS — Login / Signup / Google
// ================================

function switchAuthTab(which) {
    document.getElementById('tabLogin').classList.toggle('active', which === 'login');
    document.getElementById('tabSignup').classList.toggle('active', which === 'signup');
    document.getElementById('loginForm').style.display = which === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = which === 'signup' ? 'block' : 'none';
}

async function handleLogin() {
    const identifier = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errEl.style.display = 'none';

    if (!identifier || !password) {
        errEl.textContent = 'Please enter your email/username and password';
        errEl.style.display = 'block';
        return;
    }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    const result = await apiPost('/api/auth/login', { identifier, password });

    if (result.success) {
        window.location.href = `${API_URL}/dashboard`;
    } else {
        errEl.textContent = result.error || 'Invalid login credentials';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}

async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errEl = document.getElementById('signupError');
    const btn = document.getElementById('signupBtn');

    errEl.style.display = 'none';

    if (!name || !password) {
        errEl.textContent = 'Name and password are required';
        errEl.style.display = 'block';
        return;
    }
    if (!email && !username) {
        errEl.textContent = 'Provide an email address or choose a username';
        errEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters';
        errEl.style.display = 'block';
        return;
    }

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    const result = await apiPost('/api/auth/signup', { name, email, username, password });

    if (result.success) {
        window.location.href = `${API_URL}/dashboard`;
    } else {
        errEl.textContent = result.error || 'Could not create account';
        errEl.style.display = 'block';
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}

function showResetPanel() {
    document.getElementById('resetPasswordPanel').style.display = 'block';
}

async function handlePasswordReset() {
    const identifier = document.getElementById('resetIdentifier').value.trim();
    const newPassword = document.getElementById('resetPassword').value;
    const errEl = document.getElementById('resetError');

    errEl.style.display = 'none';
    if (!identifier || !newPassword) {
        errEl.textContent = 'Please enter your email/username and a new password';
        errEl.style.display = 'block';
        return;
    }

    const result = await apiPost('/api/auth/password/reset', { identifier, newPassword });
    if (result.success) {
        errEl.style.display = 'block';
        errEl.style.background = '#E7F3EC';
        errEl.style.color = 'var(--status-connected)';
        errEl.textContent = result.message || 'Password updated successfully';
    } else {
        errEl.textContent = result.error || 'Could not reset password';
        errEl.style.display = 'block';
    }
}

function handleGoogleLogin() {
    toast('Google sign-in is disabled. Please contact the administrator to create an account.', 'error');
}

function togglePassword(fieldId, btnId) {
    const f = document.getElementById(fieldId);
    const b = document.getElementById(btnId);
    if (!f) return;
    if (f.type === 'password') {
        f.type = 'text';
        if (b) b.textContent = 'Hide';
    } else {
        f.type = 'password';
        if (b) b.textContent = 'Show';
    }
}

// Enter key submits whichever form is visible
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const loginVisible = document.getElementById('loginForm').style.display !== 'none';
    if (loginVisible) handleLogin();
    else handleSignup();
});