// ================================
// HELPERS JS
// ================================

function getBadgeClass(status) {
    const classes = {
        'Connected':     'badge-connected',
        'Scheduled':     'badge-scheduled',
        'Not Connected': 'badge-notconnected',
        'Unknown':       'badge-unknown'
    };
    return classes[status] || 'badge-unknown';
}

function getStatusColor(status) {
    const colors = {
        'Connected':     '#27AE60',
        'Scheduled':     '#F5A623',
        'Not Connected': '#C0392B',
        'Unknown':       '#95a5a6'
    };
    return colors[status] || '#95a5a6';
}

function formatNumber(n) {
    return Number(n).toLocaleString();
}

function getCurrentDateTime() {
    return new Date().toLocaleString('en-KE');
}