// ================================
// REPORTS JS
// ================================

async function renderReports() {
    const stats = await fetchStats();
    if (!stats) return;

    const total = Number(stats.total);
    const connected = Number(stats.connected);
    const scheduled = Number(stats.scheduled);
    const notConn = Number(stats.not_connected);

    // Summary Stats
    document.getElementById('reportStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Schools</div>
            <div class="stat-value">
                ${total.toLocaleString()}
            </div>
            <div class="stat-sub">North Rift Region</div>
        </div>
        <div class="stat-card green">
            <div class="stat-label">Connected</div>
            <div class="stat-value">${connected}</div>
            <div class="stat-sub">
                ${(connected/total*100).toFixed(1)}% coverage
            </div>
        </div>
        <div class="stat-card orange">
            <div class="stat-label">Scheduled</div>
            <div class="stat-value">${scheduled}</div>
            <div class="stat-sub">Pending connection</div>
        </div>
        <div class="stat-card red">
            <div class="stat-label">Not Connected</div>
            <div class="stat-value">
                ${notConn.toLocaleString()}
            </div>
            <div class="stat-sub">Need connectivity</div>
        </div>
    `;

    // County Table
    document.getElementById('countyReport').innerHTML =
        stats.by_county.map(function(c) {
            const ct = Number(c.total);
            const cc = Number(c.connected);
            const csc = Number(c.scheduled);
            const cnc = Number(c.not_connected);
            const cov = ct > 0 ?
                (cc/ct*100).toFixed(1) : '0.0';

            return `
                <tr>
                    <td><strong>${c.county}</strong></td>
                    <td>${ct}</td>
                    <td style="color:var(--success);
                    font-weight:600">${cc}</td>
                    <td style="color:var(--warn);
                    font-weight:600">${csc}</td>
                    <td style="color:var(--danger);
                    font-weight:600">${cnc}</td>
                    <td>${cov}%</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill"
                            style="width:${cov}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    // Bar Chart
    const maxCount = Math.max(
        ...stats.by_county.map(c => Number(c.total))
    );

    document.getElementById('reportBarChart').innerHTML =
        stats.by_county.map(function(c) {
            const n = Number(c.total);
            const w = (n/maxCount*100).toFixed(1);
            return `
                <div class="bar-row">
                    <div class="bar-label">${c.county}</div>
                    <div class="bar-track">
                        <div class="bar-fill"
                        style="width:${w}%"></div>
                    </div>
                    <div class="bar-count">${n}</div>
                </div>
            `;
        }).join('');
}

// Run on load
renderReports();