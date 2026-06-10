// ================================
// GIS MAP
// ================================

// Create the map
const map = L.map('mapContainer').setView([2.5, 36.0], 7);

// Add map tiles from OpenStreetMap
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap contributors' }
).addTo(map);

// Store all markers
let markers = [];

// Colors for each status
const STATUS_COLORS = {
    'Connected': '#27AE60',
    'Scheduled': '#F5A623',
    'Not Connected': '#C0392B',
    'Unknown': '#95a5a6'
};

// ================================
// RENDER MAP
// ================================
function renderMap() {

    // Remove old markers
    markers.forEach(function(m) {
        map.removeLayer(m);
    });
    markers = [];

    // Get filter values
    const county = document.getElementById('mapCounty').value;
    const status = document.getElementById('mapStatus').value;
    const type = document.getElementById('mapType').value;

    // Filter schools
    const filtered = SCHOOLS.filter(function(school) {

        // Must have coordinates
        const hasCoords = school.lat && 
            school.lng && 
            !isNaN(school.lat) && 
            !isNaN(school.lng);
        if(!hasCoords) return false;

        // Apply filters
        if(county && school.county !== county) return false;
        if(status && school.status !== status) return false;
        if(type && school.type !== type) return false;

        return true;
    });

    // Show count
    document.getElementById('mapCount').textContent = 
        `Showing ${filtered.length} schools on map`;

    // Add markers to map
    filtered.forEach(function(school) {

        // Get color for this school status
        const color = STATUS_COLORS[school.status] || '#999';

        // Create custom colored dot marker
        const icon = L.divIcon({
            html: `
                <div style="
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: ${color};
                    border: 2px solid white;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                "></div>
            `,
            className: '',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        // Create marker
        const marker = L.marker(
            [school.lat, school.lng], 
            { icon: icon }
        ).addTo(map);

        // Add popup when clicked
        marker.bindPopup(`
            <div style="
                font-family: Segoe UI, sans-serif;
                min-width: 200px;
                padding: 4px;
            ">
                <strong style="font-size:14px">
                    ${school.name}
                </strong>
                <br>
                <span style="font-size:12px; color:#666">
                    ${school.nemis} · ${school.county}
                </span>
                <br><br>
                <span style="
                    background: ${color};
                    color: white;
                    padding: 2px 10px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 600;
                ">
                    ${school.status}
                </span>
                <br><br>
                <span style="font-size:12px; color:#666">
                    📍 ${school.subCounty}, ${school.county}
                </span>
                <br>
                <span style="font-size:12px; color:#666">
                    ${school.statusDetail || ''}
                </span>
            </div>
        `);

        // Save marker
        markers.push(marker);
    });
}

// ================================
// START — Show all schools on load
// ================================
renderMap();