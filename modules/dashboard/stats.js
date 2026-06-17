// ================================
// DASHBOARD STATS MODULE
// ================================

function getDashboardStats(schools) {
    return {
        total: schools.length,
        connected: schools.filter(
            s => s.status === 'Connected').length,
        scheduled: schools.filter(
            s => s.status === 'Scheduled').length,
        notConnected: schools.filter(
            s => s.status === 'Not Connected').length,
        counties: [
            ...new Set(schools.map(s => s.county))
        ].length
    };
}

function getCountyCoverage(schools, county) {
    const countySchools = schools.filter(
        s => s.county === county
    );
    const connected = countySchools.filter(
        s => s.status === 'Connected'
    ).length;
    return countySchools.length > 0
        ? (connected / countySchools.length * 100).toFixed(1)
        : '0.0';
}