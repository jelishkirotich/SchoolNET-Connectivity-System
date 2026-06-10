// ================================
// DASHBOARD LOGIC
// ================================

// Count schools by status
const total = SCHOOLS.length;
const connected = SCHOOLS.filter(s => s.status === 'Connected').length;
const scheduled = SCHOOLS.filter(s => s.status === 'Scheduled').length;
const notConnected = SCHOOLS.filter(s => s.status === 'Not Connected').length;
const counties = [...new Set(SCHOOLS.map(s => s.county))].length;

// Show numbers in stat cards
document.getElementById('totalSchools').textContent = total;
document.getElementById('totalConnected').textContent = connected;
document.getElementById('totalScheduled').textContent = scheduled;
document.getElementById('totalNotConnected').textContent = notConnected;
document.getElementById('totalCounties').textContent = counties;

// Show recent schools in table
const tbody = document.getElementById('recentSchools');

SCHOOLS.forEach(function(school) {

    // Decide badge color based on status
    let badgeClass = '';
    if(school.status === 'Connected') badgeClass = 'badge-connected';
    if(school.status === 'Scheduled') badgeClass = 'badge-scheduled';
    if(school.status === 'Not Connected') badgeClass = 'badge-notconnected';

    // Create a table row
    tbody.innerHTML += `
        <tr>
            <td>${school.id}</td>
            <td><strong>${school.name}</strong></td>
            <td>${school.county}</td>
            <td>${school.subCounty}</td>
            <td>${school.nemis}</td>
            <td>
                <span class="badge ${badgeClass}">
                    ${school.status}
                </span>
            </td>
        </tr>
    `;
});