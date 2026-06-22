// ================================
// DASHBOARD JS
// ================================

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
        <div class="stat-card">
            <div class="stat-label">Total Institutions</div>
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-sub">North Rift Region — ${counties} Counties</div>
        </div>
        <div class="stat-card connected">
            <div class="stat-label">Connected</div>
            <div class="stat-value">${connected}</div>
            <div class="stat-sub">${(connected/total*100).toFixed(1)}% coverage</div>
        </div>
        <div class="stat-card scheduled">
            <div class="stat-label">Scheduled</div>
            <div class="stat-value">${scheduled}</div>
            <div class="stat-sub">Pending connection</div>
        </div>
        <div class="stat-card not-connected">
            <div class="stat-label">Not Connected</div>
            <div class="stat-value">${notConn.toLocaleString()}</div>
            <div class="stat-sub">${(notConn/total*100).toFixed(1)}% unconnected</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Open Issues</div>
            <div class="stat-value" style="color:var(--accent)">${openIssues}</div>
            <div class="stat-sub">Awaiting resolution</div>
        </div>
    `;

    // County bar chart (simple horizontal bars, no external chart library needed)
    const byCounty = s.by_county;
    const max = Math.max(...byCounty.map(c => Number(c.total)));

    document.getElementById('countyChart').innerHTML = byCounty.map(c => {
        const total = Number(c.total);
        const width = (total / max * 100).toFixed(1);
        return `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-family:'Segoe UI',sans-serif;font-size:12.5px">
                <div style="width:130px;text-align:right;color:var(--text)">${c.county}</div>
                <div style="flex:1;height:16px;background:var(--bg);border-radius:3px;overflow:hidden">
                    <div style="height:100%;width:${width}%;background:var(--navy-deep);border-radius:3px"></div>
                </div>
                <div style="width:40px;font-weight:700;color:var(--navy-deep)">${total}</div>
            </div>
        `;
    }).join('');

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
}