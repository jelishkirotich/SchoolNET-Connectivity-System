// ================================
// GIS MAP JS
// ================================

let leafletMap = null;
let markers = [];

const STATUS_COLORS = {
    'Connected':     '#27AE60',
    'Scheduled':     '#F5A623',
    'Not Connected': '#C0392B',
    'Unknown':       '#95a5a6'
};

async function initMap() {
    if (!leafletMap) {
        leafletMap = L.map('mapContainer')
            .setView([2.5, 36.0], 7);
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {attribution: '© OpenStreetMap contributors'}
        ).addTo(leafletMap);

        // Sub-county dropdown
        const subs = [
            ...new Set(
                allSchools.map(s => s.sub_county)
                .filter(Boolean)
            )
        ].sort();
        const sel = document.getElementById('mapSubCounty');
        if (sel) {
            subs.forEach(function(sc) {
                const o = document.createElement('option');
                o.value = o.textContent = sc;
                sel.appendChild(o);
            });
        }
    }
    renderMap();
}

function renderMap() {
    if (!leafletMap) return;

    markers.forEach(m => leafletMap.removeLayer(m));
    markers = [];

    const county =
        document.getElementById('mapCounty').value;
    const status =
        document.getElementById('mapStatus').value;
    const subCounty =
        document.getElementById('mapSubCounty').value;

    const filtered = allSchools.filter(function(s) {
        const ok = s.lat && s.lng &&
            !isNaN(s.lat) && !isNaN(s.lng) &&
            Math.abs(s.lat) < 90 &&
            Math.abs(s.lng) < 90;
        if (!ok) return false;
        if (county && s.county !== county) return false;
        if (status && s.status !== status) return false;
        if (subCounty && s.sub_county !== subCounty)
            return false;
        return true;
    });

    document.getElementById('mapCount').textContent =
        `Showing ${filtered.length} schools on map`;

    filtered.forEach(function(s) {
        const color = STATUS_COLORS[s.status] || '#999';

        const icon = L.divIcon({
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

        const marker = L.marker([s.lat, s.lng], {icon})
            .addTo(leafletMap)
            .bindPopup(`
                <div style="font-family:Segoe UI,sans-serif;
                min-width:200px;padding:4px">
                    <strong style="font-size:14px">
                        ${s.name}
                    </strong><br>
                    <span style="font-size:12px;color:#666">
                        ${s.nemis} · ${s.county}
                    </span><br><br>
                    <span style="background:${color};
                    color:white;padding:2px 10px;
                    border-radius:10px;
                    font-size:11px;font-weight:600">
                        ${s.status}
                    </span><br><br>
                    <span style="font-size:12px;color:#666">
                        📍 ${s.sub_county}, ${s.county}
                    </span><br>
                    <span style="font-size:12px;color:#666">
                        ${s.status_detail || ''}
                    </span><br>
                    <a href="#"
                    onclick="viewProfile(${s.id});return false"
                    style="font-size:12px;color:#0A5C2E;
                    font-weight:600;margin-top:6px;
                    display:block">
                        View Profile →
                    </a>
                </div>
            `);

        markers.push(marker);
    });
}