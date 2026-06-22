// ================================
// APP JS — Session, Roles, Navigation
// Runs first on every authenticated page
// ================================

let CURRENT_USER = null;

// ================================
// CHECK SESSION + SET UP UI BASED ON ROLE
// ================================
async function initApp() {
    const result = await apiGet('/api/auth/me');

    if (!result.success) {
        window.location.href = '../index.html';
        return;
    }

    CURRENT_USER = result.user;
    applyRolePermissions(CURRENT_USER.role);
    setUserInfo(CURRENT_USER);

    // Once we know who's logged in, load the dashboard data
    renderDashboard();
}

// ================================
// SHOW/HIDE UI BASED ON ROLE
// Note: this only controls what's VISIBLE.
// The real enforcement happens server-side in Flask.
// ================================
function applyRolePermissions(role) {
    const isAdmin = role === 'admin';
    const isManagement = role === 'management';
    const isUser = role === 'user';

    // Admin-only: user management + audit log
    document.getElementById('adminSectionLabel').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('navAdmin').style.display = isAdmin ? 'flex' : 'none';

    // Admin + Management can see audit log
    document.getElementById('navAuditLog').style.display = (isAdmin || isManagement) ? 'flex' : 'none';

    // Add Institution + Upload File: Admin + User only (not Management - read only)
    const btnAdd = document.getElementById('btnAddInstitution');
    const btnUpload = document.getElementById('btnUploadFile');
    if (btnAdd) btnAdd.style.display = (isAdmin || isUser) ? 'inline-flex' : 'none';
    if (btnUpload) btnUpload.style.display = (isAdmin || isUser) ? 'inline-flex' : 'none';
}

// ================================
// TOPBAR USER INFO
// ================================
function setUserInfo(user) {
    const roleLabels = { admin: 'Admin', management: 'Management', user: 'User' };
    document.getElementById('userRolePill').textContent = roleLabels[user.role] || user.role;
    document.getElementById('userNameLabel').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.substring(0, 2).toUpperCase();
}

// ================================
// LOGOUT
// ================================
async function doLogout() {
    await apiPost('/api/auth/logout', {});
    window.location.href = '../index.html';
}

// ================================
// PAGE SWITCHING
// ================================
function showPage(p) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const page = document.getElementById('page-' + p);
    if (page) page.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        const oc = link.getAttribute('onclick') || '';
        if (oc.includes("'" + p + "'")) link.classList.add('active');
    });

    const titles = {
        dashboard: 'Dashboard',
        registry: 'Institutions Registry',
        profile: 'Institution Profile',
        map: 'GIS Map',
        issues: 'Connectivity Issue Reports',
        reports: 'Reports & Analytics',
        admin: 'User Management',
        auditlog: 'System Audit Log'
    };
    document.getElementById('pageTitle').textContent = titles[p] || p;

    if (p === 'map') setTimeout(initMap, 200);
    if (p === 'issues') renderIssuesTable();
    if (p === 'reports') renderReports();
    if (p === 'admin') renderUsersTable();
    if (p === 'auditlog') renderAuditLog();
}

// ================================
// MODAL TAB SWITCHING (reusable pattern)
// ================================
function switchModalTab(prefix, tabId) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    const content = document.getElementById(prefix + '-' + tabId);
    if (content) content.classList.add('active');
}

// ================================
// FRESHNESS INDICATOR
// Returns HTML for how recently a status was verified
// ================================
function getFreshnessHtml(lastVerifiedAt) {
    if (!lastVerifiedAt) return '<span class="freshness old"><span class="freshness-dot"></span>Unknown</span>';

    const verified = new Date(lastVerifiedAt);
    const now = new Date();
    const daysAgo = Math.floor((now - verified) / (1000 * 60 * 60 * 24));

    let cls = 'fresh', label = '';
    if (daysAgo <= 30) { cls = 'fresh'; label = daysAgo === 0 ? 'Today' : `${daysAgo}d ago`; }
    else if (daysAgo <= 180) { cls = 'stale'; label = `${Math.floor(daysAgo / 30)}mo ago`; }
    else { cls = 'old'; label = `${Math.floor(daysAgo / 365)}yr+ ago`; }

    return `<span class="freshness ${cls}"><span class="freshness-dot"></span>${label}</span>`;
}

// Start the app once this script loads
initApp();