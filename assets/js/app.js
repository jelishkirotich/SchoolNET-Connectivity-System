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
    sessionStorage.clear();
    window.location.href = '../index.html';
}

// Show page
function showPage(p) {
    document.querySelectorAll('.page').forEach(function(el) {
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(function(el) {
        el.classList.remove('active');
    });

    const page = document.getElementById('page-' + p);
    if (page) page.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(function(link) {
        const oc = link.getAttribute('onclick') || '';
        if (oc.includes("'" + p + "'")) {
            link.classList.add('active');
        }
    });

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

    if (p === 'map') setTimeout(initMap, 200);
}

// Toast notification
function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show';
    if (type) t.classList.add(type);
    setTimeout(() => {
        t.className = '';
    }, 3000);
}

// Set user info in topbar
function setUserInfo() {
    const username = sessionStorage.getItem('username') || '';
    const role = sessionStorage.getItem('role') || '';
    const name = sessionStorage.getItem('name') || '';

    const badge = document.getElementById('userBadge');
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');

    if (badge) {
        badge.textContent = username
            .substring(0, 2)
            .toUpperCase();
    }
    if (userNameEl) userNameEl.textContent = name;
    if (userRoleEl) userRoleEl.textContent = role;
}

// Switch modal tabs
function switchTab(modalPrefix, tabId) {
    // Deactivate all tabs and contents
    document.querySelectorAll('.modal-tab').forEach(function(t) {
        t.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(function(c) {
        c.classList.remove('active');
    });

    // Activate selected tab
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');

    // Activate selected content
    const content = document.getElementById(
        modalPrefix + '-' + tabId
    );
    if (content) content.classList.add('active');
}

// File preview
function previewFile(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const file = input.files[0];

    if (!file) return;

    const nameEl = document.getElementById(
        inputId.replace('File', 'FileName')
    );
    const sizeEl = document.getElementById(
        inputId.replace('File', 'FileSize')
    );

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) {
        const size = file.size < 1024 * 1024
            ? (file.size / 1024).toFixed(1) + ' KB'
            : (file.size / 1024 / 1024).toFixed(1) + ' MB';
        sizeEl.textContent = size;
    }

    preview.classList.add('show');
}

// Clear file
function clearFile(inputId, previewId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId)
        .classList.remove('show');
}

// Run on load
checkAuth();
setUserInfo();