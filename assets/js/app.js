// ================================
// APP JS
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

    // Set active nav link
    document.querySelectorAll('.nav-link').forEach(function(link) {
        const oc = link.getAttribute('onclick') || '';
        if (oc.includes("'" + p + "'")) {
            link.classList.add('active');
        }
    });

    // Update topbar title
    const titles = {
        dashboard: 'Dashboard',
        registry:  'School Registry',
        profile:   'School Profile',
        map:       'GIS Mapping',
        reports:   'Reports & Analytics',
        admin:     'Administration'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = titles[p] || p;
    }

    // Init map when map page is opened
    if (p === 'map') {
        setTimeout(initMap, 200);
    }
}

// Toast notification
function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Set user badge initials
function setUserBadge() {
    const username = sessionStorage.getItem('username') || 'AD';
    const badge = document.getElementById('userBadge');
    if (badge) {
        badge.textContent = username
            .substring(0, 2)
            .toUpperCase();
    }
}

// Run on every page load
checkAuth();
setUserBadge();