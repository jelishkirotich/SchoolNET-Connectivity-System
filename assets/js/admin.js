// ================================
// ADMIN JS
// ================================

let USERS = [
    {
        id: 1,
        name: 'Admin User',
        username: 'admin',
        role: 'Super Admin',
        status: 'Active'
    },
    {
        id: 2,
        name: 'County Officer',
        username: 'county01',
        role: 'Editor',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Field Agent',
        username: 'agent01',
        role: 'Field Agent',
        status: 'Inactive'
    }
];

const AUDIT_LOGS = [
    {
        action: 'Admin imported 1,457 school records',
        time: '2026-06-09 10:23'
    },
    {
        action: 'System initialised successfully',
        time: '2026-06-09 10:20'
    },
    {
        action: 'Registry exported to CSV',
        time: '2026-06-08 14:10'
    },
    {
        action: 'Status updated: KAINUK GIRLS → Scheduled',
        time: '2026-06-08 09:05'
    },
    {
        action: 'New user added: County Officer',
        time: '2026-06-07 11:30'
    }
];

// ================================
// RENDER ADMIN
// ================================
function renderAdmin() {

    // Users Table
    document.getElementById('usersTable').innerHTML =
        USERS.map(u => `
            <tr>
                <td style="padding:7px 4px">
                    <strong>${u.name}</strong>
                </td>
                <td style="padding:7px 4px">${u.role}</td>
                <td style="padding:7px 4px">
                    <span class="badge
                    badge-${u.status === 'Active' ?
                    'connected' : 'unknown'}">
                        ${u.status}
                    </span>
                </td>
            </tr>
        `).join('');

    // Audit Log
    document.getElementById('auditLog').innerHTML =
        AUDIT_LOGS.map(l => `
            <div class="audit-item">
                ${l.action}
                <div class="audit-time">${l.time}</div>
            </div>
        `).join('');

    // System Info
    document.getElementById('sysInfo').innerHTML = `
        <div class="info-row">
            <span class="lbl">Version</span>
            <span class="val">1.0.0</span>
        </div>
        <div class="info-row">
            <span class="lbl">Total Records</span>
            <span class="val">
                ${SCHOOLS.length.toLocaleString()}
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Region</span>
            <span class="val">North Rift</span>
        </div>
        <div class="info-row">
            <span class="lbl">Counties</span>
            <span class="val">
                ${[...new Set(SCHOOLS.map(s => s.county))].length}
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Connected</span>
            <span class="val">
                ${SCHOOLS.filter(s =>
                    s.status === 'Connected').length}
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Last Updated</span>
            <span class="val">June 2026</span>
        </div>
    `;
}

// ================================
// USER MODAL
// ================================
function openUserModal() {
    document.getElementById('uName').value = '';
    document.getElementById('uUsername').value = '';
    document.getElementById('uPassword').value = '';
    document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('open');
}

function saveUser() {
    const name = document.getElementById('uName').value.trim();
    const username = document.getElementById('uUsername')
        .value.trim();

    if (!name || !username) {
        toast('Name and username are required');
        return;
    }

    USERS.push({
        id: USERS.length + 1,
        name: name,
        username: username,
        role: document.getElementById('uRole').value,
        status: document.getElementById('uStatus').value
    });

    AUDIT_LOGS.unshift({
        action: `New user added: ${name}`,
        time: new Date().toLocaleString()
    });

    closeUserModal();
    renderAdmin();
    toast('User added successfully!');
}

// Run on load
renderAdmin();