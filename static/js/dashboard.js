// ================================
// DASHBOARD JS
// ================================

let dashboardFilter = '';
let dashboardCountyFilter = '';

function getCountyColor(index) {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 62%, 40%)`;
}

function setDashboardFilter(status, county = '') {
    dashboardFilter = status || '';
    dashboardCountyFilter = county || '';

    if (status === 'issues') {
        showPage('issues');
        return;
    }

    showPage('registry');
    setTimeout(() => {
        const statusSelect = document.getElementById('filterStatus');
        const countySelect = document.getElementById('filterCounty');
        if (statusSelect) statusSelect.value = dashboardFilter;
        if (countySelect) countySelect.value = dashboardCountyFilter;
        if (typeof filterRegistry === 'function') filterRegistry();
    }, 150);
}

async function renderDashboard() {
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-label">Loading...</div><div class="stat-value">...</div></div>
    `;

    const result = await apiGet('/api/stats');

    if (!result.success) {
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Connection Error</div>
                <div class="stat-value" style="font-size:15px;color:var(--status-not-connected)">
                    ${result.error || 'Could not load stats'}
                </div>
            </div>`;
        return;
    }

    const s = result.data;
    const total = Number(s.total);
    const connected = Number(s.connected);
    const scheduled = Number(s.scheduled);
    const notConn = Number(s.not_connected);
    const counties = s.by_county.length;
    const openIssues = Number(s.open_issues || 0);

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card" onclick="setDashboardFilter('')" style="cursor:pointer">
            <div class="stat-label">Total Institutions</div>
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-sub">North Rift Region — ${counties} Counties</div>
        </div>
        <div class="stat-card connected" onclick="setDashboardFilter('Connected')" style="cursor:pointer">
            <div class="stat-label">Connected</div>
            <div class="stat-value">${connected}</div>
            <div class="stat-sub">${(connected/total*100).toFixed(1)}% coverage</div>
        </div>
        <div class="stat-card scheduled" onclick="setDashboardFilter('Scheduled')" style="cursor:pointer">
            <div class="stat-label">Scheduled</div>
            <div class="stat-value">${scheduled}</div>
            <div class="stat-sub">Pending connection</div>
        </div>
        <div class="stat-card not-connected" onclick="setDashboardFilter('Not Connected')" style="cursor:pointer">
            <div class="stat-label">Not Connected</div>
            <div class="stat-value">${notConn.toLocaleString()}</div>
            <div class="stat-sub">${(notConn/total*100).toFixed(1)}% unconnected</div>
        </div>
        <div class="stat-card" onclick="setDashboardFilter('issues')" style="cursor:pointer">
            <div class="stat-label">Open Issues</div>
            <div class="stat-value" style="color:var(--accent)">${openIssues}</div>
            <div class="stat-sub">Awaiting resolution</div>
        </div>
    `;

    const byCounty = s.by_county;

    document.getElementById('countyChart').innerHTML = `
        <div class="county-chart-legend">
            <span><i style="background:var(--status-connected)"></i>Connected</span>
            <span><i style="background:var(--status-scheduled)"></i>Scheduled</span>
            <span><i style="background:var(--status-not-connected)"></i>Not Connected</span>
        </div>
        <div class="county-chart-grid">
            ${byCounty.map((c, index) => {
                const total = Number(c.total);
                const connected = Number(c.connected || 0);
                const scheduled = Number(c.scheduled || 0);
                const notConnected = Number(c.not_connected || 0);
                const connectedPct = total > 0 ? (connected / total) * 100 : 0;
                const scheduledPct = total > 0 ? (scheduled / total) * 100 : 0;
                const notConnectedPct = total > 0 ? (notConnected / total) * 100 : 0;
                const coveragePct = total > 0 ? (connected / total) * 100 : 0;
                const color = getCountyColor(index);
                return `
                    <div class="county-chart-card" onclick="setDashboardFilter('', '${c.county.replace(/'/g, "\\'")}')" title="Show ${c.county} institutions" style="border-left:4px solid ${color}">
                        <div class="county-chart-card-head">
                            <div>
                                <div class="county-chart-card-name">${c.county}</div>
                                <div class="county-chart-card-meta">${total} institutions</div>
                            </div>
                            <div class="county-chart-card-coverage">${coveragePct.toFixed(0)}%</div>
                        </div>
                        <div class="county-chart-progress">
                            <div class="county-chart-progress-segment connected" style="width:${connectedPct}%"></div>
                            <div class="county-chart-progress-segment scheduled" style="width:${scheduledPct}%"></div>
                            <div class="county-chart-progress-segment not-connected" style="width:${notConnectedPct}%"></div>
                        </div>
                        <div class="county-chart-stats">
                            <span>${connected} connected</span>
                            <span>${scheduled} scheduled</span>
                            <span>${notConnected} not connected</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Recent institutions
    const instResult = await apiGet('/api/institutions');
    if (instResult.success) {
        document.getElementById('recentTable').innerHTML = instResult.data.slice(0, 10).map(inst => `
            <tr>
                <td style="color:var(--text-muted);font-size:12px">${inst.id}</td>
                <td>
                    <a href="#" onclick="viewProfile(${inst.id});return false" style="color:var(--navy-deep);font-weight:600;font-family:'Segoe UI',sans-serif">
                        ${inst.name}
                    </a>
                </td>
                <td>${inst.county}</td>
                <td>${inst.sub_county}</td>
                <td><code style="font-size:11px;background:var(--bg);padding:2px 6px;border-radius:3px">${inst.nemis}</code></td>
                <td><span class="badge badge-${inst.status.toLowerCase().replace(/ /g,'')}">${inst.status}</span></td>
                <td>${getFreshnessHtml(inst.last_verified_at)}</td>
            </tr>
        `).join('');
    }
    // Load notifications for the user
    if (typeof loadNotifications === 'function') loadNotifications();
}

async function loadNotifications() {
    const res = await apiGet('/api/notifications');
    const listEl = document.getElementById('notifList');
    const countEl = document.getElementById('notifCount');
    if (!listEl || !countEl) return;
    if (!res.success) {
        listEl.innerHTML = `<div style="color:var(--text-muted)">Unable to load notifications</div>`;
        countEl.textContent = '';
        return;
    }
    const notes = res.data || [];
    countEl.textContent = notes.length > 0 ? ` ${notes.length}` : '';
    listEl.innerHTML = notes.length === 0 ? `<div style="color:var(--text-muted)">No recent notifications</div>` : notes.map(n => `
        <div style="padding:8px;border-bottom:1px solid var(--border);font-size:13px">
            <div style="font-weight:600">${n.action}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${new Date(n.created_at).toLocaleString()}</div>
        </div>
    `).join('');
}

function toggleNotifications() {
    const p = document.getElementById('notifPanel');
    if (!p) return;
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

// Auto-refresh notifications every 30 seconds
if (typeof loadNotifications === 'function') {
    // initial load
    try { loadNotifications(); } catch (e) { console.warn('Notification load failed', e); }
    setInterval(() => {
        try { loadNotifications(); } catch (e) { console.warn('Notification poll failed', e); }
    }, 30000);
}