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
        window.location.href = '/index.html';
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
    const permissions = CURRENT_USER && CURRENT_USER.permissions ? CURRENT_USER.permissions : {};
    window.CURRENT_USER_PERMISSIONS = permissions;
    const isAdmin = role === 'admin' || permissions.can_manage_users;
    const isManagement = role === 'management';
    const isField = role === 'field';
    const isViewer = role === 'viewer';
    const isUser = role === 'user';

    const canManageInstitutions = permissions.can_manage_institutions || isAdmin || isManagement;
    const canManageInventory = permissions.can_manage_inventory || isAdmin || isField || isManagement;
    const canReportIssues = permissions.can_report_issue || isAdmin || isUser || isField || isManagement || isViewer;
    const canViewReports = permissions.can_view_reports || isAdmin;
    const canViewAudit = permissions.can_view_audit || isAdmin || isManagement;
    const canManageUsers = permissions.can_manage_users || isAdmin;
    const canViewRoles = permissions.can_view_roles || isAdmin || isManagement;
    const canViewIpMonitor = permissions.can_view_ip_monitor || isAdmin;
    const canResolveIssues = permissions.can_resolve_issues || isAdmin || isManagement || isField;

    window.CURRENT_USER_CAN_RESOLVE_ISSUES = canResolveIssues;

    const showAdminLabel = canManageUsers || canViewRoles || canViewAudit || canViewIpMonitor;
    document.getElementById('adminSectionLabel').style.display = showAdminLabel ? 'block' : 'none';
    document.getElementById('navAdmin').style.display = canManageUsers ? 'flex' : 'none';
    document.getElementById('navAuditLog').style.display = canViewAudit ? 'flex' : 'none';
    document.getElementById('navIpStatus').style.display = canViewIpMonitor ? 'flex' : 'none';
    document.getElementById('navReports').style.display = canViewReports ? 'flex' : 'none';
    document.getElementById('navRoles').style.display = canViewRoles ? 'flex' : 'none';

    const btnAdd = document.getElementById('btnAddInstitution');
    const btnUpload = document.getElementById('btnUploadFile');
    const btnBulkImport = document.getElementById('btnBulkImport');
    const btnAddInventory = document.getElementById('btnAddInventory');
    const btnReportIssue = document.getElementById('btnReportIssue');

    if (btnAdd) btnAdd.style.display = canManageInstitutions ? 'inline-flex' : 'none';
    if (btnUpload) btnUpload.style.display = canManageInstitutions ? 'inline-flex' : 'none';
    if (btnBulkImport) btnBulkImport.style.display = canManageInstitutions ? 'inline-flex' : 'none';
    if (btnAddInventory) btnAddInventory.style.display = canManageInventory ? 'inline-flex' : 'none';
    if (btnReportIssue) btnReportIssue.style.display = canReportIssues ? 'inline-flex' : 'none';

    const inventoryNav = document.querySelector('.nav-link[onclick="showPage(\'inventory\')"]');
    if (inventoryNav) inventoryNav.style.display = (canManageInventory || canManageInstitutions || canViewAudit) ? 'flex' : 'none';

    const issuesNav = document.querySelector('.nav-link[onclick="showPage(\'issues\')"]');
    if (issuesNav) issuesNav.style.display = canReportIssues ? 'flex' : 'none';
}

// ================================
// TOPBAR USER INFO
// ================================
function setUserInfo(user) {
    const roleLabels = { admin: 'Admin', management: 'Management', field: 'Field Staff', viewer: 'Viewer', user: 'User' };
    document.getElementById('userRolePill').textContent = roleLabels[user.role] || user.role;
    document.getElementById('userNameLabel').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.substring(0, 2).toUpperCase();
}

// ================================
// LOGOUT
// ================================
async function doLogout() {
    await apiPost('/api/auth/logout', {});
    window.location.href = '/index.html';
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
        inventory: 'Inventory',
        registry: 'Institutions Registry',
        profile: 'Institution Profile',
        map: 'GIS Map',
        issues: 'Connectivity Issue Reports',
        ipstatus: 'IP Connectivity Status',
        reports: 'Reports & Analytics',
        roles: 'Roles & Permissions',
        admin: 'User Management',
        auditlog: 'System Audit Log'
    };
    document.getElementById('pageTitle').textContent = titles[p] || p;

    if (p === 'map') setTimeout(initMap, 200);
    if (p === 'issues') renderIssuesTable();
    if (p === 'ipstatus') renderIpStatusMonitor();
    if (p === 'reports') renderReports();
    if (p === 'admin') renderUsersTable();
    if (p === 'auditlog') renderAuditLog();
    if (p === 'inventory') renderInventory();
    if (p === 'registry') {
        const statusSelect = document.getElementById('filterStatus');
        const countySelect = document.getElementById('filterCounty');

        if (statusSelect) {
            statusSelect.value = dashboardFilter && dashboardFilter !== 'issues' ? dashboardFilter : '';
        }
        if (countySelect) {
            countySelect.value = dashboardCountyFilter || '';
        }
        if (typeof loadRegistry === 'function') loadRegistry();
    }
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

    // Accept either ISO or MySQL-style timestamps. Normalize spaces to T for
    // consistent Date parsing across browsers.
    let verifiedStr = typeof lastVerifiedAt === 'string' ? lastVerifiedAt : String(lastVerifiedAt);
    verifiedStr = verifiedStr.replace(' ', 'T');
    const verified = new Date(verifiedStr);
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