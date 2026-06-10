// ================================
// REPORTS PAGE
// ================================

// ================================
// SUMMARY STATS
// ================================
const total = SCHOOLS.length;
const connected = SCHOOLS.filter(s => s.status === 'Connected').length;
const scheduled = SCHOOLS.filter(s => s.status === 'Scheduled').length;
const notConnected = SCHOOLS.filter(s => s.status === 'Not Connected').length;
const coverage = ((connected / total) * 100).toFixed(1);

document.getElementById('reportStats').innerHTML = `
    <div class="stat-card">
        <div class="stat-label">Total Schools</div>
        <div class="stat-value">${total}</div>
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
        <div class="stat-value">${notConnected}</div>
        <div class="stat-sub">Need connectivity</div>
    </div>
`;

// ================================
// COUNTY REPORT TABLE
// ================================

// Get unique counties
const counties = [...new Set(SCHOOLS.map(s => s.county))];

const tbody = document.getElementById('countyReport');
tbody.innerHTML = '';

// County stats
counties.forEach(function(county) {

    // Get schools in this county
    const countySchools = SCHOOLS.filter(s => s.county === county);
    const countyTotal = countySchools.length;
    const countyConnected = countySchools.filter(
        s => s.status === 'Connected').length;
    const countyScheduled = countySchools.filter(
        s => s.status === 'Scheduled').length;
    const countyNotConnected = countySchools.filter(
        s => s.status === 'Not Connected').length;
    const countyCoverage = ((countyConnected / countyTotal) * 100).toFixed(1);

    tbody.innerHTML += `
        <tr>
            <td><strong>${county}</strong></td>
            <td>${countyTotal}</td>
            <td style="color:#27AE60;font-weight:600">
                ${countyConnected}
            </td>
            <td style="color:#E67E22;font-weight:600">
                ${countyScheduled}
            </td>
            <td style="color:#C0392B;font-weight:600">
                ${countyNotConnected}
            </td>
            <td>${countyCoverage}%</td>
            <td>
                <div class="progress-track">
                    <div class="progress-fill" 
                    style="width:${countyCoverage}%"></div>
                </div>
            </td>
        </tr>
    `;
});

// ================================
// BAR CHART
// ================================
const barChart = document.getElementById('barChart');
barChart.innerHTML = '';

// Get max count for scaling bars
const maxCount = Math.max(...counties.map(c => 
    SCHOOLS.filter(s => s.county === c).length
));

counties.forEach(function(county) {
    const count = SCHOOLS.filter(s => s.county === county).length;
    const width = ((count / maxCount) * 100).toFixed(1);

    barChart.innerHTML += `
        <div class="bar-row">
            <div class="bar-label">${county}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width:${width}%"></div>
            </div>
            <div class="bar-count">${count}</div>
        </div>
    `;
});

// ================================
// EXPORT CSV
// ================================
function exportCSV() {

    // CSV headers
    const headers = [
        'ID', 'Name', 'NEMIS', 'County', 
        'Sub County', 'Type', 'Status', 'Status Detail'
    ];

    // CSV rows
    const rows = SCHOOLS.map(function(s) {
        return [
            s.id, s.name, s.nemis, s.county,
            s.subCounty, s.type, s.status, s.statusDetail || ''
        ].join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Create download link
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'schoolnet_report.csv';
    a.click();
}