// GIS Map Module
function getMapMarkerColor(status) {
    const colors = {
        'Connected': '#27AE60',
        'Scheduled': '#F5A623',
        'Not Connected': '#C0392B',
        'Unknown': '#95a5a6'
    };
    return colors[status] || '#95a5a6';
}