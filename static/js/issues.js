// ================================
// CONNECTIVITY ISSUE REPORTING
// ================================

function openIssueModal() {
    document.getElementById('issueTitle').value = '';
    document.getElementById('issueDescription').value = '';
    document.getElementById('issueSeverity').value = 'Medium';
    document.getElementById('issueModal').classList.add('open');
}

function closeIssueModal() {
    document.getElementById('issueModal').classList.remove('open');
}

async function saveIssue() {
    const title = document.getElementById('issueTitle').value.trim();
    const description = document.getElementById('issueDescription').value.trim();
    const severity = document.getElementById('issueSeverity').value;

    if (!title) {
        toast('A title is required', 'error');
        return;
    }

    const institutionId = window.currentProfileInstitutionId;
    if (!institutionId) {
        toast('No institution selected', 'error');
        return;
    }

    const result = await apiPost('/api/issues', {
        institutionId, title, description, severity
    });

    if (result.success) {
        toast('Issue reported successfully', 'success');
        closeIssueModal();
        viewProfile(institutionId);
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

async function resolveIssue(issueId) {
    if (!confirm('Mark this issue as resolved?')) return;
    const result = await apiPut(`/api/issues/${issueId}/resolve`, {});
    if (result.success) {
        toast('Issue marked resolved', 'success');
        if (window.currentProfileInstitutionId) viewProfile(window.currentProfileInstitutionId);
        renderIssuesTable();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

// ================================
// ISSUES TABLE (sidebar page)
// ================================
async function renderIssuesTable() {
    const result = await apiGet('/api/issues');
    if (!result.success) {
        toast('Failed to load issues: ' + result.error, 'error');
        return;
    }

    const canResolve = window.CURRENT_USER_CAN_RESOLVE_ISSUES || false;

    document.getElementById('issuesTable').innerHTML = result.data.map(issue => {
        const severityColor = {
            Low: 'var(--status-unknown)', Medium: 'var(--status-scheduled)',
            High: 'var(--accent)', Critical: 'var(--status-not-connected)'
        }[issue.severity] || 'var(--text-muted)';

        return `
            <tr>
                <td style="font-size:12px;color:var(--text-muted)">${issue.id}</td>
                <td><a href="#" onclick="viewProfile(${issue.institution_id});return false" style="color:var(--navy-deep);font-weight:600">${issue.institution_name}</a></td>
                <td>${issue.title}</td>
                <td><span style="color:${severityColor};font-weight:700;font-size:11.5px">${issue.severity}</span></td>
                <td><span class="badge badge-${issue.status === 'Resolved' ? 'connected' : 'notconnected'}">${issue.status}</span></td>
                <td>${issue.reported_by}</td>
                <td>${new Date(issue.created_at).toLocaleDateString()}</td>
                <td>${issue.status === 'Open' && canResolve ? `<button class="btn btn-outline btn-sm" onclick="resolveIssue(${issue.id})">Resolve</button>` : '—'}</td>
            </tr>
        `;
    }).join('');
}