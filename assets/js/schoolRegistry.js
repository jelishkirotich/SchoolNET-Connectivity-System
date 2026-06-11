// ================================
// SCHOOL REGISTRY JS
// ================================

let editId = null;
let currentPage = 1;
const PAGE_SIZE = 25;
let filteredSchools = [...SCHOOLS];

// Populate county dropdown
const counties = [...new Set(SCHOOLS.map(s => s.county))].sort();
const filterCountyEl = document.getElementById('filterCounty');
counties.forEach(function(c) {
    const o = document.createElement('option');
    o.value = o.textContent = c;
    filterCountyEl.appendChild(o);
});

// ================================
// RENDER TABLE
// ================================
function renderRegistry() {
    const total = filteredSchools.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filteredSchools.slice(start, start + PAGE_SIZE);

    document.getElementById('noResults').style.display =
        total === 0 ? 'block' : 'none';

    document.getElementById('registryBody').innerHTML =
        pageData.map(s => `
            <tr>
                <td style="color:var(--text-muted);
                font-size:12px">${s.id}</td>
                <td><strong>${s.name}</strong></td>
                <td>
                    <code style="font-size:11px;
                    background:var(--bg);
                    padding:2px 5px;
                    border-radius:3px">
                        ${s.nemis}
                    </code>
                </td>
                <td>${s.county}</td>
                <td>${s.subCounty}</td>
                <td>${s.zone || '—'}</td>
                <td style="font-size:11px;font-weight:600">
                    ${s.type}
                </td>
                <td>
                    <span class="badge badge-${s.status
                    .toLowerCase().replace(/ /g,'')}">
                        ${s.status}
                    </span>
                </td>
                <td style="font-size:11px;
                color:var(--text-muted);
                max-width:140px;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap"
                title="${s.statusDetail || ''}">
                    ${s.statusDetail || '—'}
                </td>
                <td>
                    <div style="display:flex;gap:4px">
                        <button class="btn btn-outline btn-sm"
                        onclick="viewProfile(${s.id})">
                            View
                        </button>
                        <button class="btn btn-primary btn-sm"
                        onclick="openEditModal(${s.id})">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm"
                        onclick="deleteSchool(${s.id})">
                            Del
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    // Pagination info
    document.getElementById('pgInfo').textContent =
        `Showing ${Math.min(start+1, total)}–
        ${Math.min(start+PAGE_SIZE, total)}
        of ${total.toLocaleString()} records`;

    // Pagination buttons
    const pgBtns = document.getElementById('pgBtns');
    pgBtns.innerHTML = '';

    const pgStart = Math.max(1, currentPage - 3);
    const pgEnd = Math.min(totalPages, pgStart + 6);

    if (pgStart > 1) {
        const b = document.createElement('button');
        b.className = 'pg-btn';
        b.textContent = '«';
        b.onclick = () => { currentPage = 1; renderRegistry(); };
        pgBtns.appendChild(b);
    }

    for (let i = pgStart; i <= pgEnd; i++) {
        const b = document.createElement('button');
        b.className = 'pg-btn' + (i === currentPage ? ' active' : '');
        b.textContent = i;
        b.onclick = (pg => () => {
            currentPage = pg;
            renderRegistry();
        })(i);
        pgBtns.appendChild(b);
    }

    if (pgEnd < totalPages) {
        const b = document.createElement('button');
        b.className = 'pg-btn';
        b.textContent = '»';
        b.onclick = () => {
            currentPage = totalPages;
            renderRegistry();
        };
        pgBtns.appendChild(b);
    }
}

// ================================
// FILTER
// ================================
function filterRegistry() {
    const q = document.getElementById('searchBox')
        .value.toLowerCase();
    const county = document.getElementById('filterCounty').value;
    const status = document.getElementById('filterStatus').value;

    filteredSchools = SCHOOLS.filter(function(s) {
        const mQ = !q ||
            s.name.toLowerCase().includes(q) ||
            s.nemis.toLowerCase().includes(q) ||
            (s.zone || '').toLowerCase().includes(q) ||
            (s.subCounty || '').toLowerCase().includes(q);
        const mC = !county || s.county === county;
        const mS = !status || s.status === status;
        return mQ && mC && mS;
    });

    currentPage = 1;
    renderRegistry();
}

// ================================
// VIEW PROFILE
// ================================
function viewProfile(id) {
    const s = SCHOOLS.find(x => x.id === id);
    if (!s) return;

    showPage('profile');

    document.getElementById('profileName').textContent = s.name;
    document.getElementById('profileSub').textContent =
        `${s.subCounty} Sub-County, ${s.county} County`;
    document.getElementById('profileBadge').innerHTML =
        `<span class="badge badge-${s.status.toLowerCase()
        .replace(/ /g,'')}">
            ${s.status}
        </span>`;

    document.getElementById('profileDetails').innerHTML = `
        <div class="info-row">
            <span class="lbl">NEMIS Code</span>
            <span class="val">${s.nemis}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Type</span>
            <span class="val">${s.type}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Region</span>
            <span class="val">${s.region}</span>
        </div>
        <div class="info-row">
            <span class="lbl">County</span>
            <span class="val">${s.county}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Sub-County</span>
            <span class="val">${s.subCounty}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Zone</span>
            <span class="val">${s.zone || '—'}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Coordinates</span>
            <span class="val">
                ${s.lat ? s.lat.toFixed(4)+', '+s.lng.toFixed(4) : 'N/A'}
            </span>
        </div>
    `;

    document.getElementById('profileConn').innerHTML = `
        <div class="info-row">
            <span class="lbl">Status</span>
            <span class="val">
                <span class="badge badge-${s.status.toLowerCase()
                .replace(/ /g,'')}">
                    ${s.status}
                </span>
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Detail</span>
            <span class="val">${s.statusDetail || '—'}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Comments</span>
            <span class="val">${s.comments || '—'}</span>
        </div>
    `;

    // Profile mini map
    const mapDiv = document.getElementById('profileMap');
    mapDiv.innerHTML = '';

    if (s.lat && s.lng &&
        Math.abs(s.lat) < 90 && Math.abs(s.lng) < 90) {
        setTimeout(function() {
            const m = L.map('profileMap')
                .setView([s.lat, s.lng], 12);
            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                { attribution: '© OpenStreetMap' }
            ).addTo(m);
            L.marker([s.lat, s.lng]).addTo(m)
                .bindPopup(`<b>${s.name}</b><br>${s.status}`)
                .openPopup();
        }, 150);
    } else {
        mapDiv.innerHTML = `
            <div style="padding:40px;text-align:center;
            color:var(--text-muted);font-size:13px">
                No GPS coordinates available.
            </div>`;
    }
}

// ================================
// ADD MODAL
// ================================
function openAddModal() {
    editId = null;
    document.getElementById('modalTitle').textContent = 'Add School';
    ['fName','fNemis','fSubCounty','fZone',
    'fStatusDetail','fLat','fLng','fComments']
    .forEach(id => document.getElementById(id).value = '');
    document.getElementById('fType').value = 'PUBLIC';
    document.getElementById('fStatus').value = 'Not Connected';
    document.getElementById('schoolModal').classList.add('open');
}

// ================================
// EDIT MODAL
// ================================
function openEditModal(id) {
    editId = id;
    const s = SCHOOLS.find(x => x.id === id);
    if (!s) return;
    document.getElementById('modalTitle').textContent = 'Edit School';
    document.getElementById('fName').value = s.name;
    document.getElementById('fNemis').value = s.nemis;
    document.getElementById('fType').value = s.type;
    document.getElementById('fCounty').value = s.county;
    document.getElementById('fSubCounty').value = s.subCounty;
    document.getElementById('fZone').value = s.zone || '';
    document.getElementById('fStatus').value = s.status;
    document.getElementById('fStatusDetail').value =
        s.statusDetail || '';
    document.getElementById('fLat').value = s.lat || '';
    document.getElementById('fLng').value = s.lng || '';
    document.getElementById('fComments').value = s.comments || '';
    document.getElementById('schoolModal').classList.add('open');
}

// ================================
// CLOSE MODAL
// ================================
function closeModal() {
    document.getElementById('schoolModal').classList.remove('open');
}

// ================================
// SAVE SCHOOL
// ================================
function saveSchool() {
    const name = document.getElementById('fName').value.trim();
    if (!name) { toast('School name is required'); return; }

    const data = {
        name: name.toUpperCase(),
        nemis: document.getElementById('fNemis')
            .value.trim().toUpperCase(),
        type: document.getElementById('fType').value,
        county: document.getElementById('fCounty').value,
        subCounty: document.getElementById('fSubCounty')
            .value.trim().toUpperCase(),
        zone: document.getElementById('fZone')
            .value.trim().toUpperCase(),
        status: document.getElementById('fStatus').value,
        statusDetail: document.getElementById('fStatusDetail')
            .value.trim(),
        lat: parseFloat(document.getElementById('fLat').value)||null,
        lng: parseFloat(document.getElementById('fLng').value)||null,
        comments: document.getElementById('fComments').value.trim(),
        region: 'North Rift'
    };

    if (editId) {
        const i = SCHOOLS.findIndex(x => x.id === editId);
        SCHOOLS[i] = { ...SCHOOLS[i], ...data };
        toast('School updated successfully!');
    } else {
        data.id = SCHOOLS.length + 1;
        SCHOOLS.unshift(data);
        toast('School added successfully!');
    }

    closeModal();
    filteredSchools = [...SCHOOLS];
    renderRegistry();
    renderDashboard();
}

// ================================
// DELETE SCHOOL
// ================================
function deleteSchool(id) {
    if (!confirm('Delete this school? Cannot be undone.')) return;
    const index = SCHOOLS.findIndex(x => x.id === id);
    SCHOOLS.splice(index, 1);
    filteredSchools = filteredSchools.filter(x => x.id !== id);
    renderRegistry();
    renderDashboard();
    toast('School deleted');
}

// ================================
// EXPORT CSV
// ================================
function exportCSV() {
    const headers = [
        'ID','Name','NEMIS','County','Sub-County',
        'Zone','Type','Status','Status Detail',
        'Latitude','Longitude'
    ];
    const rows = filteredSchools.map(s => [
        s.id, s.name, s.nemis, s.county,
        s.subCounty, s.zone||'', s.type, s.status,
        s.statusDetail||'', s.lat||'', s.lng||''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' +
        encodeURIComponent(csv);
    a.download = 'schoolnet_registry.csv';
    a.click();
    toast('CSV exported successfully!');
}

// Run on load
renderRegistry();