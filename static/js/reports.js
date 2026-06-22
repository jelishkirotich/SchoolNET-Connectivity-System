// ================================
// REPORTS JS
// ================================

async function renderReports() {
    const result = await apiGet('/api/stats');
    if (!result.success) {
        toast('Failed to load reports: ' + result.error, 'error');
        return;
    }

    const s = result.data;
    const total = Number(s.total);
    const connected = Number(s.connected);
    const scheduled = Number(s.scheduled);
    const notConn = Number(s.not_connected);

    document.getElementById('reportStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Institutions</div>
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-sub">North Rift Region</div>
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
            <div class="stat-sub">Needs connectivity</div>
        </div>
    `;

    document.getElementById('countyReport').innerHTML = s.by_county.map(c => {
        const ct = Number(c.total);
        const cc = Number(c.connected);
        const csc = Number(c.scheduled);
        const cnc = Number(c.not_connected);
        const cov = ct > 0 ? (cc / ct * 100).toFixed(1) : '0.0';

        return `
            <tr>
                <td><strong>${c.county}</strong></td>
                <td>${ct}</td>
                <td style="color:var(--status-connected);font-weight:700">${cc}</td>
                <td style="color:var(--status-scheduled);font-weight:700">${csc}</td>
                <td style="color:var(--status-not-connected);font-weight:700">${cnc}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div style="flex:1;height:8px;background:var(--bg);border-radius:4px;overflow:hidden">
                            <div style="height:100%;width:${cov}%;background:var(--status-connected)"></div>
                        </div>
                        <span style="font-size:11.5px;min-width:38px">${cov}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}