// ================================
// SCHOOL REGISTRY JS
// ================================

let editId = null;
let currentPage = 1;
const PAGE_SIZE = 25;
let allSchools = [];
let filteredSchools = [];

// ================================
// LOAD SCHOOLS
// ================================
async function loadSchools() {
    document.getElementById('registryBody').innerHTML = `
        <tr>
            <td colspan="10"
            style="text-align:center;
            padding:40px;
            color:var(--text-muted)">
                Loading schools from database...
            </td>
        </tr>
    `;

    allSchools = await fetchSchools();
    filteredSchools = [...allSchools];

    // Populate county dropdowns
    const counties = [
        ...new Set(allSchools.map(s => s.county))
    ].sort();

    const filterSel = document.getElementById('filterCounty');
    filterSel.innerHTML =
        '<option value="">All Counties</option>';
    counties.forEach(function(c) {
        const o = document.createElement('option');
        o.value = o.textContent = c;
        filterSel.appendChild(o);
    });

    // Populate map county dropdown
    const mapSel = document.getElementById('mapCounty');
    if (mapSel) {
        mapSel.innerHTML =
            '<option value="">All Counties</option>';
        counties.forEach(function(c) {
            const o = document.createElement('option');
            o.value = o.textContent = c;
            mapSel.appendChild(o);
        });
    }

    // Populate upload school dropdowns
    ['uploadSchool','uploadSchoolImg'].forEach(function(id) {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML =
            '<option value="">-- Select School --</option>';
        allSchools.forEach(function(s) {
            const o = document.createElement('option');
            o.value = s.id;
            o.textContent = `${s.name} (${s.county})`;
            sel.appendChild(o);
        });
    });

    renderRegistry();
}

// ================================
// RENDER TABLE
// ================================
function renderRegistry() {
    const total = filteredSchools.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filteredSchools.slice(
        start, start + PAGE_SIZE
    );

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
                <td>${s.sub_county}</td>
                <td>${s.zone || '—'}</td>
                <td style="font-size:11px;
                font-weight:600">
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
                title="${s.status_detail || ''}">
                    ${s.status_detail || '—'}
                </td>
                <td>
                    <div style="display:flex;gap:4px">
                        <button
                            class="btn btn-outline btn-sm"
                            onclick="viewProfile(${s.id})">
                            View
                        </button>
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="openEditModal(${s.id})">
                            Edit
                        </button>
                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteSchool(${s.id})">
                            Del
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    // Pagination info
    document.getElementById('pgInfo').textContent =
        `Showing ${Math.min(start+1,total)}–` +
        `${Math.min(start+PAGE_SIZE,total)} ` +
        `of ${total.toLocaleString()} records`;

    // Pagination buttons
    const pgBtns = document.getElementById('pgBtns');
    pgBtns.innerHTML = '';

    const pgStart = Math.max(1, currentPage - 3);
    const pgEnd = Math.min(totalPages, pgStart + 6);

    if (pgStart > 1) {
        const b = document.createElement('button');
        b.className = 'pg-btn';
        b.textContent = '«';
        b.onclick = () => {
            currentPage = 1;
            renderRegistry();
        };
        pgBtns.appendChild(b);
    }

    for (let i = pgStart; i <= pgEnd; i++) {
        const b = document.createElement('button');
        b.className = 'pg-btn' +
            (i === currentPage ? ' active' : '');
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
    const county =
        document.getElementById('filterCounty').value;
    const status =
        document.getElementById('filterStatus').value;

    filteredSchools = allSchools.filter(function(s) {
        const mQ = !q ||
            s.name.toLowerCase().includes(q) ||
            s.nemis.toLowerCase().includes(q) ||
            (s.zone || '').toLowerCase().includes(q) ||
            (s.sub_county || '').toLowerCase().includes(q);
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
    const s = allSchools.find(x => x.id === id);
    if (!s) return;

    showPage('profile');

    document.getElementById('profileName').textContent =
        s.name;
    document.getElementById('profileSub').textContent =
        `${s.sub_county} Sub-County, ${s.county} County`;
    document.getElementById('profileBadge').innerHTML =
        `<span class="badge badge-${s.status
        .toLowerCase().replace(/ /g,'')}">
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
            <span class="val">${s.sub_county}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Zone</span>
            <span class="val">${s.zone || '—'}</span>
        </div>
        <div class="info-row">
            <span class="lbl">Coordinates</span>
            <span class="val">
                ${s.lat ?
                    Number(s.lat).toFixed(4) + ', ' +
                    Number(s.lng).toFixed(4) : 'N/A'}
            </span>
        </div>
    `;

    document.getElementById('profileConn').innerHTML = `
        <div class="info-row">
            <span class="lbl">Status</span>
            <span class="val">
                <span class="badge badge-${s.status
                .toLowerCase().replace(/ /g,'')}">
                    ${s.status}
                </span>
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Detail</span>
            <span class="val">
                ${s.status_detail || '—'}
            </span>
        </div>
        <div class="info-row">
            <span class="lbl">Comments</span>
            <span class="val">
                ${s.comments || '—'}
            </span>
        </div>
    `;

    // Profile Map
    const mapDiv = document.getElementById('profileMap');
    mapDiv.innerHTML = '';

    if (s.lat && s.lng &&
        Math.abs(s.lat) < 90 &&
        Math.abs(s.lng) < 90) {
        setTimeout(function() {
            const m = L.map('profileMap')
                .setView([s.lat, s.lng], 12);
            L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {attribution: '© OpenStreetMap'}
            ).addTo(m);
            L.marker([s.lat, s.lng]).addTo(m)
                .bindPopup(
                    `<b>${s.name}</b><br>${s.status}`
                ).openPopup();
        }, 150);
    } else {
        mapDiv.innerHTML = `
            <div style="padding:40px;
            text-align:center;
            color:var(--text-muted);
            font-size:13px">
                No GPS coordinates available.
            </div>`;
    }
}

// ================================
// OPEN SCHOOL MODAL
// ================================
function openSchoolModal() {
    editId = null;
    document.getElementById('modalTitle').textContent =
        'Add School';

    // Clear all fields
    ['fName','fNemis','fSubCounty','fZone',
    'fLat','fLng','fAddress',
    'fStatusDetail','fComments'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    document.getElementById('fType').value = 'PUBLIC';
    document.getElementById('fStatus').value =
        'Not Connected';
    document.getElementById('fRegion').value = 'North Rift';

    // Reset to first tab
    switchTab('school', 'tabBasic');

    document.getElementById('schoolModal')
        .classList.add('open');
}

// ================================
// OPEN EDIT MODAL
// ================================
function openEditModal(id) {
    editId = id;
    const s = allSchools.find(x => x.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent =
        'Edit School';
    document.getElementById('fName').value = s.name;
    document.getElementById('fNemis').value = s.nemis;
    document.getElementById('fType').value = s.type;
    document.getElementById('fCounty').value = s.county;
    document.getElementById('fSubCounty').value =
        s.sub_county;
    document.getElementById('fZone').value = s.zone || '';
    document.getElementById('fRegion').value =
        s.region || 'North Rift';
    document.getElementById('fLat').value = s.lat || '';
    document.getElementById('fLng').value = s.lng || '';
    document.getElementById('fStatus').value = s.status;
    document.getElementById('fStatusDetail').value =
        s.status_detail || '';
    document.getElementById('fComments').value =
        s.comments || '';

    switchTab('school', 'tabBasic');
    document.getElementById('schoolModal')
        .classList.add('open');
}

// ================================
// CLOSE SCHOOL MODAL
// ================================
function closeSchoolModal() {
    document.getElementById('schoolModal')
        .classList.remove('open');
}

// ================================
// SAVE SCHOOL
// ================================
async function saveSchool() {
    const name = document.getElementById('fName')
        .value.trim();
    const nemis = document.getElementById('fNemis')
        .value.trim();

    if (!name) {
        toast('School name is required', 'error');
        switchTab('school', 'tabBasic');
        return;
    }

    if (!nemis) {
        toast('NEMIS code is required', 'error');
        switchTab('school', 'tabBasic');
        return;
    }

    const data = {
        name: name.toUpperCase(),
        nemis: nemis.toUpperCase(),
        type: document.getElementById('fType').value,
        county: document.getElementById('fCounty').value,
        subCounty: document.getElementById('fSubCounty')
            .value.trim().toUpperCase(),
        zone: document.getElementById('fZone')
            .value.trim().toUpperCase(),
        region: 'North Rift',
        lat: parseFloat(
            document.getElementById('fLat').value) || null,
        lng: parseFloat(
            document.getElementById('fLng').value) || null,
        status: document.getElementById('fStatus').value,
        statusDetail: document.getElementById('fStatusDetail')
            .value.trim(),
        comments: document.getElementById('fComments')
            .value.trim()
    };

    let result;
    if (editId) {
        result = await apiUpdateSchool(editId, data);
    } else {
        result = await apiAddSchool(data);
    }

    if (result.success) {
        toast(
            editId ?
            'School updated successfully!' :
            'School added successfully!',
            'success'
        );
        closeSchoolModal();
        await loadSchools();
        renderDashboard();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

// ================================
// DELETE SCHOOL
// ================================
async function deleteSchool(id) {
    if (!confirm(
        'Delete this school? This cannot be undone.'
    )) return;

    const result = await apiDeleteSchool(id);

    if (result.success) {
        toast('School deleted successfully', 'success');
        await loadSchools();
        renderDashboard();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

// ================================
// UPLOAD MODAL
// ================================
function openUploadModal() {
    switchTab('upload', 'tabDoc');
    document.getElementById('uploadModal')
        .classList.add('open');
}

function closeUploadModal() {
    document.getElementById('uploadModal')
        .classList.remove('open');
}

function handleUpload() {
    const docFile = document.getElementById('docFile');
    const imgFile = document.getElementById('imgFile');
    const excelFile = document.getElementById('excelFile');

    const activeTab = document.querySelector(
        '#uploadModal .tab-content.active'
    );

    if (!activeTab) return;

    const tabId = activeTab.id;

    if (tabId === 'upload-tabDoc') {
        if (!docFile.files[0]) {
            toast('Please select a file', 'error');
            return;
        }
        if (!document.getElementById('uploadSchool').value) {
            toast('Please select a school', 'error');
            return;
        }
        toast('Document uploaded successfully!', 'success');
        closeUploadModal();

    } else if (tabId === 'upload-tabImage') {
        if (!imgFile.files[0]) {
            toast('Please select an image', 'error');
            return;
        }
        toast('Image uploaded successfully!', 'success');
        closeUploadModal();

    } else if (tabId === 'upload-tabExcel') {
        if (!excelFile.files[0]) {
            toast('Please select a file', 'error');
            return;
        }
        toast('File uploaded successfully!', 'success');
        closeUploadModal();
    }
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
        s.sub_county, s.zone || '', s.type,
        s.status, s.status_detail || '',
        s.lat || '', s.lng || ''
    ].map(v =>
        `"${String(v).replace(/"/g,'""')}"`
    ).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' +
        encodeURIComponent(csv);
    a.download = 'schoolnet_registry.csv';
    a.click();
    toast('CSV exported successfully!', 'success');
}

// Run on load
loadSchools();