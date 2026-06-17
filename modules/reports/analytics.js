// ================================
// ANALYTICS MODULE
// ================================

function getCountyReport(schools) {
    const counties = [
        ...new Set(schools.map(s => s.county))
    ].sort();

    return counties.map(function(county) {
        const cs = schools.filter(s => s.county === county);
        const connected = cs.filter(
            s => s.status === 'Connected').length;
        const scheduled = cs.filter(
            s => s.status === 'Scheduled').length;
        const notConnected = cs.filter(
            s => s.status === 'Not Connected').length;

        return {
            county,
            total: cs.length,
            connected,
            scheduled,
            notConnected,
            coverage: cs.length > 0
                ? (connected / cs.length * 100).toFixed(1)
                : '0.0'
        };
    });
}

function generateCSV(schools) {
    const headers = [
        'ID', 'Name', 'NEMIS', 'County',
        'Sub-County', 'Zone', 'Type',
        'Status', 'Status Detail',
        'Latitude', 'Longitude'
    ];

    const rows = schools.map(s => [
        s.id, s.name, s.nemis, s.county,
        s.sub_county, s.zone || '', s.type,
        s.status, s.status_detail || '',
        s.lat || '', s.lng || ''
    ].map(v =>
        `"${String(v).replace(/"/g, '""')}"`
    ).join(','));

    return [headers.join(','), ...rows].join('\n');
}