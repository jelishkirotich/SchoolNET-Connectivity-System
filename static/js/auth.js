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
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errEl.style.display = 'none';

    if (!email || !password) {
        errEl.textContent = 'Please enter your email and password';
        errEl.style.display = 'block';
        return;
    }

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    const result = await apiPost('/api/auth/login', { email, password });

    if (result.success) {
        window.location.href = 'templates/dashboard.html';
    } else {
        errEl.textContent = result.error || 'Invalid email or password';
        errEl.style.display = 'block';
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}

async function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errEl = document.getElementById('signupError');
    const btn = document.getElementById('signupBtn');

    errEl.style.display = 'none';

    if (!name || !email || !password) {
        errEl.textContent = 'All fields are required';
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

    const result = await apiPost('/api/auth/signup', { name, email, password });

    if (result.success) {
        window.location.href = 'templates/dashboard.html';
    } else {
        errEl.textContent = result.error || 'Could not create account';
        errEl.style.display = 'block';
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}

function handleGoogleLogin() {
    window.location.href = `${API_URL}/api/auth/google`;
}

// Enter key submits whichever form is visible
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const loginVisible = document.getElementById('loginForm').style.display !== 'none';
    if (loginVisible) handleLogin();
    else handleSignup();
});