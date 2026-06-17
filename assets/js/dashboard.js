// ================================
// DASHBOARD JS
// ================================

async function renderDashboard() {
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Loading...</div>
            <div class="stat-value">...</div>
        </div>
    `;

    const stats = await fetchStats();

    if (!stats) {
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Connection Error</div>
                <div class="stat-value" 
                style="font-size:16px;color:var(--danger)">
                    Make sure Flask is running on port 5000
                </div>
            </div>
        `;
        return;
    }

    const total = Number(stats.total);
    const connected = Number(stats.connected);
    const scheduled = Number(stats.scheduled);
    const notConn = Number(stats.not_connected);
    const counties = stats.by_county.length;

    // Stat Cards
    document.getElementById('statsGrid').innerHTML = `
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
            <div class="stat-sub">
                ${(notConn/total*100).toFixed(1)}% unconnected
            </div>
        </div>
        <div class="stat-card blue">
            <div class="stat-label">Counties</div>
            <div class="stat-value">${counties}</div>
            <div class="stat-sub">Coverage area</div>
        </div>
    `;

    // County Bar Chart
    const byCounty = stats.by_county;
    const max = Math.max(...byCounty.map(c => c.total));

    document.getElementById('countyChart').innerHTML =
        byCounty.map(c => `
            <div class="bar-row">
                <div class="bar-label" title="${c.county}">
                    ${c.county}
                </div>
                <div class="bar-track">
                    <div class="bar-fill"
                    style="width:${(c.total/max*100).toFixed(1)}%">
                    </div>
                </div>
                <div class="bar-count">${c.total}</div>
            </div>
        `).join('');

    // Donut Chart
    const ctx = document.getElementById('donutCanvas')
        .getContext('2d');
    const colors = [
        '#27AE60','#F5A623','#C0392B','#95a5a6'
    ];
    const labels = [
        'Connected','Scheduled','Not Connected','Unknown'
    ];
    const vals = [connected, scheduled, notConn, 0];
    const tot = vals.reduce((a, b) => a + b, 0);

    let start = -Math.PI / 2;
    ctx.clearRect(0, 0, 130, 130);

    vals.forEach(function(v, i) {
        if (v === 0) return;
        const angle = (v / tot) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(65, 65);
        ctx.arc(65, 65, 55, start, start + angle);
        ctx.fillStyle = colors[i];
        ctx.fill();
        start += angle;
    });

    ctx.beginPath();
    ctx.arc(65, 65, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 13px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toLocaleString(), 65, 65);

    document.getElementById('donutLegend').innerHTML =
        labels.map((l, i) => `
            <div class="legend-item">
                <div class="legend-dot"
                style="background:${colors[i]}"></div>
                <span>${l}: <b>${vals[i]}</b></span>
            </div>
        `).join('');

    // Recent Schools
    const schools = await fetchSchools();
    document.getElementById('recentTable').innerHTML =
        schools.slice(0, 10).map(s => `
            <tr>
                <td style="color:var(--text-muted);
                font-size:12px">${s.id}</td>
                <td>
                    <a href="#"
                    onclick="viewProfile(${s.id});
                    return false"
                    style="color:var(--brand);
                    font-weight:600;
                    text-decoration:none">
                        ${s.name}
                    </a>
                </td>
                <td>${s.county}</td>
                <td>${s.sub_county}</td>
                <td>
                    <code style="font-size:11px;
                    background:var(--bg);
                    padding:2px 5px;
                    border-radius:3px">
                        ${s.nemis}
                    </code>
                </td>
                <td>
                    <span class="badge badge-${s.status
                    .toLowerCase().replace(/ /g,'')}">
                        ${s.status}
                    </span>
                </td>
            </tr>
        `).join('');
}

// Run on load
renderDashboard();