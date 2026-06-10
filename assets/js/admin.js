// ================================
// ADMINISTRATION PAGE
// ================================

// ================================
// USERS DATA
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

// ================================
// AUDIT LOG DATA
// ================================
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
// RENDER USERS TABLE
// ================================
function renderUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    USERS.forEach(function(user) {

        const statusColor = user.status === 'Active'
            ? 'badge-connected'
            : 'badge-unknown';

        tbody.innerHTML += `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.role}</td>
                <td>
                    <span class="badge ${statusColor}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <button class="btn-remove"
                    onclick="removeUser(${user.id})">
                        Remove
                    </button>
                </td>
            </tr>
        `;
    });
}

// ================================
// RENDER AUDIT LOG
// ================================
function renderAuditLog() {
    const list = document.getElementById('auditLog');
    list.innerHTML = '';

    AUDIT_LOGS.forEach(function(log) {
        list.innerHTML += `
            <div class="audit-item">
                ${log.action}
                <div class="audit-time">${log.time}</div>
            </div>
        `;
    });
}

// ================================
// RENDER SYSTEM INFO
// ================================
function renderSystemInfo() {
    document.getElementById('sysTotal').textContent =
        SCHOOLS.length;
    document.getElementById('sysCounties').textContent =
        [...new Set(SCHOOLS.map(s => s.county))].length;
    document.getElementById('sysConnected').textContent =
        SCHOOLS.filter(s => s.status === 'Connected').length;
}

// ================================
// OPEN USER MODAL
// ================================
function openUserModal() {
    document.getElementById('uName').value = '';
    document.getElementById('uUsername').value = '';
    document.getElementById('uPassword').value = '';
    document.getElementById('userModal').classList.add('open');
}

// ================================
// CLOSE USER MODAL
// ================================
function closeUserModal() {
    document.getElementById('userModal').classList.remove('open');
}

// ================================
// SAVE USER
// ================================
function saveUser() {
    const name = document.getElementById('uName').value.trim();
    const username = document.getElementById('uUsername')
        .value.trim();

    if(!name || !username) {
        alert('Name and username are required');
        return;
    }

    const newUser = {
        id: USERS.length + 1,
        name: name,
        username: username,
        role: document.getElementById('uRole').value,
        status: document.getElementById('uStatus').value
    };

    USERS.push(newUser);

    // Add to audit log
    AUDIT_LOGS.unshift({
        action: `New user added: ${name}`,
        time: new Date().toLocaleString()
    });

    closeUserModal();
    renderUsers();
    renderAuditLog();
    alert('User added successfully!');
}

// ================================
// REMOVE USER
// ================================
function removeUser(id) {
    if(!confirm('Remove this user?')) return;

    const user = USERS.find(u => u.id === id);
    USERS = USERS.filter(u => u.id !== id);

    // Add to audit log
    AUDIT_LOGS.unshift({
        action: `User removed: ${user.name}`,
        time: new Date().toLocaleString()
    });

    renderUsers();
    renderAuditLog();
}

// ================================
// START
// ================================
renderUsers();
renderAuditLog();
renderSystemInfo();