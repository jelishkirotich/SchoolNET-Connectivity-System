// ================================
// GIS MAP MODULE
// ================================

function getMarkerColor(status) {
    const colors = {
        'Connected':     '#27AE60',
        'Scheduled':     '#F5A623',
        'Not Connected': '#C0392B',
        'Unknown':       '#95a5a6'
    };
    return colors[status] || '#95a5a6';
}

function createMarkerIcon(color) {
    return L.divIcon({
        html: `<div style="
            width:12px;height:12px;
            border-radius:50%;
            background:${color};
            border:2px solid white;
            box-shadow:0 1px 4px rgba(0,0,0,0.4)">
        </div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
}

function filterMapSchools(schools, county, status, subCounty) {
    return schools.filter(function(s) {
        const hasCoords = s.lat && s.lng &&
            !isNaN(s.lat) && !isNaN(s.lng) &&
            Math.abs(s.lat) < 90 &&
            Math.abs(s.lng) < 90;
        if (!hasCoords) return false;
        if (county && s.county !== county) return false;
        if (status && s.status !== status) return false;
        if (subCounty && s.sub_county !== subCounty)
            return false;
        return true;
    });
}