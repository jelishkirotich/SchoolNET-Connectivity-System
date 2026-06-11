// ================================
// REPORTS JS
// ================================

function renderReports() {

    const total = SCHOOLS.length;
    const connected = SCHOOLS.filter(
        s => s.status === 'Connected').length;
    const scheduled = SCHOOLS.filter(
        s => s.status === 'Scheduled').length;
    const notConn = SCHOOLS.filter(
        s => s.status === 'Not Connected').length;
    const coverage = (connected / total * 100).toFixed(1);

    // Summary Stats
    document.getElementById('reportStats').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Schools</div>
            <div class="stat-value">${total.toLocaleString()}</div>
            <div class="stat-sub">North Rift Region</div>
        </div>
        <div class="stat-card green">
            <div class="stat-label">Connected</div>
            <div class="stat-value">${connected}</div>
            <div class="stat-sub">${coverage}% coverage</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-label">Scheduled</div>
            <div class="stat-value">${scheduled}</div>
            <div class="stat-sub">Pending connection</div>
        </div>
        <div class="stat-card red">
            <div class="stat-label">Not Connected</div>
            <div class="stat-value">${notConn.toLocaleString()}</div>
            <div class="stat-sub">Need connectivity</div>
        </div>
    `;

    // County Report Table
    const counties = [
        ...new Set(SCHOOLS.map(s => s.county))
    ].sort();

    document.getElementById('countyReport').innerHTML =
        counties.map(function(county) {
            const cs = SCHOOLS.filter(s => s.county === county);
            const ct = cs.length;
            const cc = cs.filter(
                s => s.status === 'Connected').length;
            const csc = cs.filter(
                s => s.status === 'Scheduled').length;
            const cnc = cs.filter(
                s => s.status === 'Not Connected').length;
            const cov = (cc / ct * 100).toFixed(1);

            return `
                <tr>
                    <td><strong>${county}</strong></td>
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
    const maxCount = Math.max(...counties.map(c =>
        SCHOOLS.filter(s => s.county === c).length
    ));

    document.getElementById('reportBarChart').innerHTML =
        counties.map(function(c) {
            const n = SCHOOLS.filter(s => s.county === c).length;
            const w = (n / maxCount * 100).toFixed(1);
            return `
                <div class="bar-row">
                    <div class="bar-label">${c}</div>
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