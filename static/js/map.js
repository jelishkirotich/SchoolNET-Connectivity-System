// ================================
// GIS MAP JS — with marker clustering
// ================================

let leafletMap = null;
let markerClusterGroup = null;

const STATUS_COLORS = {
    'Connected':     '#2E7D4F',
    'Scheduled':     '#B8862E',
    'Not Connected': '#A23B3B',
    'Unknown':       '#6B7280'
};

function initMap() {
    if (!leafletMap) {
        leafletMap = L.map('mapContainer').setView([2.5, 36.0], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);
    }
    renderMap();
}

function renderMap() {
    if (!leafletMap) return;

    if (markerClusterGroup) {
        leafletMap.removeLayer(markerClusterGroup);
    }
    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
            const markers = cluster.getAllChildMarkers();
            const notConnectedCount = markers.filter(m => m.options.statusType === 'Not Connected').length;
            const dominant = notConnectedCount > markers.length / 2 ? '#A23B3B' : '#11284D';
            return L.divIcon({
                html: `<div style="
                    background:${dominant};color:#fff;
                    width:36px;height:36px;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    font-weight:700;font-size:12px;
                    border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.4);
                    font-family:'Segoe UI',sans-serif;">
                    ${markers.length}
                </div>`,
                className: '',
                iconSize: [36, 36]
            });
        }
    });

    const county = document.getElementById('mapCounty').value;
    const status = document.getElementById('mapStatus').value;

    const filtered = allInstitutions.filter(inst => {
        const hasCoords = inst.lat && inst.lng && !isNaN(inst.lat) && !isNaN(inst.lng)
            && Math.abs(inst.lat) < 90 && Math.abs(inst.lng) < 90;
        if (!hasCoords) return false;
        if (county && inst.county !== county) return false;
        if (status && inst.status !== status) return false;
        return true;
    });

    document.getElementById('mapCount').textContent = `Showing ${filtered.length} institutions on map`;

    filtered.forEach(inst => {
        const color = STATUS_COLORS[inst.status] || '#6B7280';
        const icon = L.divIcon({
            html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
            className: '',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = L.marker([inst.lat, inst.lng], { icon, statusType: inst.status })
            .bindPopup(`
                <div style="font-family:Segoe UI,sans-serif;min-width:200px">
                    <strong style="font-size:13px">${inst.name}</strong><br>
                    <span style="font-size:11px;color:#666">${inst.nemis} · ${inst.county}</span><br><br>
                    <span style="background:${color};color:#fff;padding:2px 9px;border-radius:10px;font-size:10.5px;font-weight:700">
                        ${inst.status}
                    </span><br><br>
                    <a href="#" onclick="viewProfile(${inst.id});return false" style="font-size:12px;color:#11284D;font-weight:700">
                        View Profile →
                    </a>
                </div>
            `);

        markerClusterGroup.addLayer(marker);
    });

    leafletMap.addLayer(markerClusterGroup);
}