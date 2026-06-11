// ================================
// APP JS — Runs on every page
// ================================

// Check login
function checkAuth() {
    const loggedIn = sessionStorage.getItem('loggedIn');
    if (!loggedIn) {
        window.location.href = '../index.html';
    }
}

// Logout
function doLogout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    window.location.href = '../index.html';
}

// Show page
function showPage(p) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(function(el) {
        el.classList.remove('active');
    });

    // Remove active from all nav links
    document.querySelectorAll('.nav-link').forEach(function(el) {
        el.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById('page-' + p);
    if (page) page.classList.add('active');

    // Set active nav
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        if (link.getAttribute('onclick') &&
            link.getAttribute('onclick').includes(p)) {
            link.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        registry:  'School Registry',
        profile:   'School Profile',
        map:       'GIS Mapping',
        reports:   'Reports & Analytics',
        admin:     'Administration'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[p] || p;

    // Init map when opened
    if (p === 'map') setTimeout(initMap, 100);
}

// Toast notification
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Set user badge
function setUserBadge() {
    const username = sessionStorage.getItem('username') || 'AD';
    const badge = document.getElementById('userBadge');
    if (badge) badge.textContent = username.substring(0, 2).toUpperCase();
}

// Run on load
checkAuth();
setUserBadge();