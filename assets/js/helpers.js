// ================================
// HELPERS JS
// ================================

// Get badge class from status
function getBadgeClass(status) {
    const classes = {
        'Connected':     'badge-connected',
        'Scheduled':     'badge-scheduled',
        'Not Connected': 'badge-notconnected',
        'Unknown':       'badge-unknown'
    };
    return classes[status] || 'badge-unknown';
}

// Get color from status
function getStatusColor(status) {
    const colors = {
        'Connected':     '#27AE60',
        'Scheduled':     '#F5A623',
        'Not Connected': '#C0392B',
        'Unknown':       '#95a5a6'
    };
    return colors[status] || '#95a5a6';
}

// Count by status
function countByStatus(schools, status) {
    return schools.filter(s => s.status === status).length;
}

// Get unique values
function getUnique(arr, key) {
    return [...new Set(arr.map(item => item[key]))]
        .filter(Boolean)
        .sort();
}

// Format number with commas
function formatNumber(n) {
    return n.toLocaleString();
}

// Get current date time
function getCurrentDateTime() {
    return new Date().toLocaleString('en-KE');
}

// Capitalize first letter
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() +
        str.slice(1).toLowerCase();
}