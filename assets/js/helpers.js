// ================================
// HELPER FUNCTIONS
// ================================

// Format date nicely
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get current date and time
function getCurrentDateTime() {
    return new Date().toLocaleString('en-KE');
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Get status badge class
function getStatusBadge(status) {
    const classes = {
        'Connected': 'badge-connected',
        'Scheduled': 'badge-scheduled',
        'Not Connected': 'badge-notconnected',
        'Unknown': 'badge-unknown'
    };
    return classes[status] || 'badge-unknown';
}

// Get status color
function getStatusColor(status) {
    const colors = {
        'Connected': '#27AE60',
        'Scheduled': '#F5A623',
        'Not Connected': '#C0392B',
        'Unknown': '#95a5a6'
    };
    return colors[status] || '#95a5a6';
}

// Count schools by status
function countByStatus(schools, status) {
    return schools.filter(s => s.status === status).length;
}

// Get unique values from array
function getUnique(arr, key) {
    return [...new Set(arr.map(item => item[key]))].filter(Boolean).sort();
}

// Export data to CSV
function downloadCSV(data, filename) {
    const headers = [
        'ID', 'Name', 'NEMIS', 'County',
        'Sub County', 'Zone', 'Type',
        'Status', 'Status Detail', 'Latitude', 'Longitude'
    ];
    const rows = data.map(s => [
        s.id, s.name, s.nemis, s.county,
        s.subCounty, s.zone, s.type,
        s.status, s.statusDetail || '',
        s.lat || '', s.lng || ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename || 'schoolnet_export.csv';
    a.click();
}

// Show toast notification
function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #1a1a2e;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, duration);
}