// ================================
// ADMIN JS — Connected to Flask
// ================================

async function renderAdmin() {

    // Load users from Flask
    const users = await fetchUsers();

    document.getElementById('usersTable').innerHTML =
        users.map(u => `
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

    // Load audit logs from Flask
    const logs = await fetchLogs();

    document.getElementById('auditLog').innerHTML =
        logs.map(l => `
            <div class="audit-item">
                ${l.action}
                <div class="audit-time">
                    ${l.created_at}
                </div>
            </div>
        `).join('');

    // System info from Flask
    const stats = await fetchStats();

    if (stats) {
        document.getElementById('sysInfo').innerHTML = `
            <div class="info-row">
                <span class="lbl">Version</span>
                <span class="val">1.0.0</span>
            </div>
            <div class="info-row">
                <span class="lbl">Total Records</span>
                <span class="val">
                    ${Number(stats.total).toLocaleString()}
                </span>
            </div>
            <div class="info-row">
                <span class="lbl">Region</span>
                <span class="val">North Rift</span>
            </div>
            <div class="info-row">
                <span class="lbl">Counties</span>
                <span class="val">
                    ${stats.by_county.length}
                </span>
            </div>
            <div class="info-row">
                <span class="lbl">Connected</span>
                <span class="val">${stats.connected}</span>
            </div>
            <div class="info-row">
                <span class="lbl">Last Updated</span>
                <span class="val">June 2026</span>
            </div>
        `;
    }
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
    document.getElementById('userModal')
        .classList.remove('open');
}

async function saveUser() {
    const name = document.getElementById('uName').value.trim();
    const username = document.getElementById('uUsername')
        .value.trim();
    const password = document.getElementById('uPassword')
        .value.trim();

    if (!name || !username || !password) {
        toast('All fields are required');
        return;
    }

    const result = await apiAddUser({
        name: name,
        username: username,
        password: password,
        role: document.getElementById('uRole').value,
        status: document.getElementById('uStatus').value
    });

    if (result.success) {
        toast('User added successfully!');
        closeUserModal();
        renderAdmin();
    } else {
        toast('Error: ' + result.error);
    }
}

// Run on load
renderAdmin();