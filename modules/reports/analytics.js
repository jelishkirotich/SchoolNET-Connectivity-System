// Analytics Module
function getCountyReport(schools) {
    const counties = [...new Set(schools.map(s => s.county))];
    return counties.map(function(county) {
        const countySchools = schools.filter(s => s.county === county);
        return {
            county: county,
            total: countySchools.length,
            connected: countySchools.filter(s => s.status === 'Connected').length,
            scheduled: countySchools.filter(s => s.status === 'Scheduled').length,
            notConnected: countySchools.filter(s => s.status === 'Not Connected').length
        };
    });
}