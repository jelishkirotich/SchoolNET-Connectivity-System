// ================================
// ADMIN JS — User Management + Audit Log
// Admin-only routes; server enforces this even if UI is bypassed
// ================================

async function renderUsersTable() {
    const result = await apiGet('/api/users');
    if (!result.success) {
        document.getElementById('usersTable').innerHTML =
            `<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted)">${result.error}</td></tr>`;
        return;
    }

    const roleLabels = { admin: 'Admin', management: 'Management', field: 'Field Staff', viewer: 'Viewer', user: 'User' };

    document.getElementById('usersTable').innerHTML = result.data.map(u => `
        <tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td>
                <select onchange="changeUserRole(${u.id}, this.value)" style="font-size:12px;padding:4px 8px">
                    <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="field" ${u.role === 'field' ? 'selected' : ''}>Field Staff</option>
                    <option value="management" ${u.role === 'management' ? 'selected' : ''}>Management</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>
                <select onchange="changeUserStatus(${u.id}, this.value)" style="font-size:12px;padding:4px 8px">
                    <option value="Active" ${u.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${u.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    <option value="Suspended" ${u.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </td>
            <td style="font-size:12px;color:var(--text-muted)">${u.auth_provider === 'google' ? '🔵 Google' : '✉️ Email'}</td>
            <td><button class="btn btn-danger btn-sm" onclick="removeUser(${u.id})">Remove</button></td>
        </tr>
    `).join('');
}

function openUserModal() {
    ['uName','uEmail','uPassword'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('uRole').value = 'viewer';
    document.getElementById('uStatus').value = 'Active';
    document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('open');
}

async function saveUser() {
    const name = document.getElementById('uName').value.trim();
    const email = document.getElementById('uEmail').value.trim();
    const password = document.getElementById('uPassword').value;
    const role = document.getElementById('uRole').value;
    const status = document.getElementById('uStatus').value;

    if (!name || !email || !password) {
        toast('All fields are required', 'error');
        return;
    }
    if (password.length < 6) {
        toast('Password must be at least 6 characters', 'error');
        return;
    }

    const result = await apiPost('/api/users', { name, email, password, role, status });

    if (result.success) {
        toast('User added successfully', 'success');
        closeUserModal();
        renderUsersTable();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

async function changeUserRole(userId, newRole) {
    const result = await apiPut(`/api/users/${userId}/role`, { role: newRole });
    if (result.success) {
        toast('User role updated', 'success');
    } else {
        toast('Error: ' + result.error, 'error');
        renderUsersTable();
    }
}

async function changeUserStatus(userId, newStatus) {
    const result = await apiPut(`/api/users/${userId}/status`, { status: newStatus });
    if (result.success) {
        toast('User status updated', 'success');
        renderUsersTable();
    } else {
        toast('Error: ' + result.error, 'error');
        renderUsersTable();
    }
}

async function removeUser(userId) {
    if (!confirm('Remove this user? They will no longer be able to log in.')) return;
    const result = await apiDelete(`/api/users/${userId}`);
    if (result.success) {
        toast('User removed', 'success');
        renderUsersTable();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

// ================================
// AUDIT LOG (Admin + Management)
// ================================
async function renderAuditLog() {
    const result = await apiGet('/api/logs');
    if (!result.success) {
        document.getElementById('auditLogList').innerHTML =
            `<p style="color:var(--text-muted)">${result.error}</p>`;
        return;
    }

    document.getElementById('auditLogList').innerHTML = result.data.map(log => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:13px">${log.action}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                ${log.username} — ${new Date(log.created_at).toLocaleString()}
            </div>
        </div>
    `).join('');
}