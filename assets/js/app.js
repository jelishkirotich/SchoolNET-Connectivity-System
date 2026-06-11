// ================================
// MAIN APP JS
// ================================

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('loggedIn');
    const currentPage = window.location.pathname;
    const isLoginPage = currentPage.includes('login.html');

    if (!isLoggedIn && !isLoginPage) {
        window.location.href = '../login.html';
    }
}

// Set active nav link
function setActiveNav() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (currentPage.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        }
    });
}

// Run on every page
checkAuth();
setActiveNav();