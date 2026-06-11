// Dashboard Stats Module
function getDashboardStats(schools) {
    return {
        total: schools.length,
        connected: schools.filter(s => s.status === 'Connected').length,
        scheduled: schools.filter(s => s.status === 'Scheduled').length,
        notConnected: schools.filter(s => s.status === 'Not Connected').length,
        counties: [...new Set(schools.map(s => s.county))].length
    };
}