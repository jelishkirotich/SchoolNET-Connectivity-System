// ================================
// INSTITUTIONS REGISTRY JS
// ================================

let editId = null;
let currentPage = 1;
const PAGE_SIZE = 25;
let allInstitutions = [];
let filteredInstitutions = [];

async function loadRegistry() {
    document.getElementById('registryBody').innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);font-family:'Segoe UI',sans-serif">
            Loading institutions...
        </td></tr>`;

    const result = await apiGet('/api/institutions');
    if (!result.success) {
        toast('Failed to load institutions: ' + result.error, 'error');
        return;
    }

    allInstitutions = result.data;
    filteredInstitutions = [...allInstitutions];

    const counties = [...new Set(allInstitutions.map(i => i.county))].sort();

    ['filterCounty', 'mapCounty'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">All Counties</option>';
        counties.forEach(c => {
            const o = document.createElement('option');
            o.value = o.textContent = c;
            sel.appendChild(o);
        });
    });

    const uploadSel = document.getElementById('uploadInstitution');
    if (uploadSel) {
        uploadSel.innerHTML = '<option value="">-- Select Institution --</option>';
        allInstitutions.forEach(i => {
            const o = document.createElement('option');
            o.value = i.id;
            o.textContent = `${i.name} (${i.county})`;
            uploadSel.appendChild(o);
        });
    }

    renderRegistry();
}

function renderRegistry() {
    const total = filteredInstitutions.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filteredInstitutions.slice(start, start + PAGE_SIZE);

    document.getElementById('noResults').style.display = total === 0 ? 'block' : 'none';

    const canEdit = (CURRENT_USER.permissions && CURRENT_USER.permissions.can_manage_institutions) || CURRENT_USER.role === 'admin' || CURRENT_USER.role === 'management';
    const canDelete = CURRENT_USER.role === 'admin';

    document.getElementById('registryBody').innerHTML = pageData.map(inst => `
        <tr>
            <td style="color:var(--text-muted);font-size:12px">${inst.id}</td>
            <td><strong>${inst.name}</strong></td>
            <td><code style="font-size:11px;background:var(--bg);padding:2px 6px;border-radius:3px">${inst.nemis}</code></td>
            <td>${inst.county}</td>
            <td>${inst.sub_county}</td>
            <td><span class="badge badge-${inst.status.toLowerCase().replace(/ /g,'')}">${inst.status}</span></td>
            <td>${getFreshnessHtml(inst.last_verified_at)}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn btn-outline btn-sm" onclick="viewProfile(${inst.id})">View</button>
                    ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="openInstitutionModal(${inst.id})">Edit</button>` : ''}
                    ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteInstitution(${inst.id})">Delete</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('pgInfo').textContent =
        `Showing ${Math.min(start+1,total)}–${Math.min(start+PAGE_SIZE,total)} of ${total.toLocaleString()} records`;

    const pgBtns = document.getElementById('pgBtns');
    pgBtns.innerHTML = '';
    const pgStart = Math.max(1, currentPage - 3);
    const pgEnd = Math.min(totalPages, pgStart + 6);

    const mkBtn = (label, page) => {
        const b = document.createElement('button');
        b.className = 'btn btn-outline btn-sm';
        if (page === currentPage) b.style.background = 'var(--navy-deep)', b.style.color = '#fff';
        b.textContent = label;
        b.onclick = () => { currentPage = page; renderRegistry(); };
        return b;
    };

    if (pgStart > 1) pgBtns.appendChild(mkBtn('«', 1));
    for (let i = pgStart; i <= pgEnd; i++) pgBtns.appendChild(mkBtn(i, i));
    if (pgEnd < totalPages) pgBtns.appendChild(mkBtn('»', totalPages));
}

function filterRegistry() {
    const q = document.getElementById('searchBox').value.toLowerCase();
    const county = document.getElementById('filterCounty').value;
    const statusSelect = document.getElementById('filterStatus');
    const status = statusSelect ? statusSelect.value : '';

    filteredInstitutions = allInstitutions.filter(inst => {
        const mQ = !q || inst.name.toLowerCase().includes(q) || inst.nemis.toLowerCase().includes(q);
        const mC = !county || inst.county === county;
        const mS = !status || inst.status === status;
        return mQ && mC && mS;
    });

    currentPage = 1;
    renderRegistry();
}

// ================================
// VIEW PROFILE — includes status timeline + issues
// ================================
async function viewProfile(id) {
    showPage('profile');

    const result = await apiGet(`/api/institutions/${id}`);
    if (!result.success) {
        toast('Could not load institution profile', 'error');
        return;
    }

    const inst = result.data;

    document.getElementById('profileName').textContent = inst.name;
    document.getElementById('profileSub').textContent = `${inst.sub_county} Sub-County, ${inst.county} County`;
    document.getElementById('profileBadge').innerHTML =
        `<span class="badge badge-${inst.status.toLowerCase().replace(/ /g,'')}">${inst.status}</span> &nbsp; ${getFreshnessHtml(inst.last_verified_at)}`;

    document.getElementById('profileDetails').innerHTML = `
        <div style="font-family:'Segoe UI',sans-serif;font-size:13px">
            <p style="margin-bottom:8px"><strong>NEMIS:</strong> ${inst.nemis}</p>
            <p style="margin-bottom:8px"><strong>Type:</strong> ${inst.type}</p>
            <p style="margin-bottom:8px"><strong>Zone:</strong> ${inst.zone || '—'}</p>
            <p style="margin-bottom:8px"><strong>Status Detail:</strong> ${inst.status_detail || '—'}</p>
            <p style="margin-bottom:8px"><strong>Coordinates:</strong> ${inst.lat ? Number(inst.lat).toFixed(4) + ', ' + Number(inst.lng).toFixed(4) : 'N/A'}</p>
            <p><strong>Comments:</strong> ${inst.comments || '—'}</p>
        </div>
    `;

    // Status timeline
    document.getElementById('profileTimeline').innerHTML = inst.history.length > 0
        ? inst.history.map(h => `
            <div class="timeline-item">
                <div class="t-status">${h.old_status ? h.old_status + ' → ' : ''}${h.new_status}</div>
                <div class="t-time">${new Date(h.changed_at).toLocaleString()} — ${h.changed_by}</div>
            </div>
        `).join('')
        : '<p style="color:var(--text-muted);font-size:13px;font-family:Segoe UI,sans-serif">No history recorded yet.</p>';

    // Issues for this institution
    document.getElementById('profileIssues').innerHTML = inst.issues.length > 0
        ? inst.issues.map(i => `
            <div style="padding:10px 0;border-bottom:1px solid var(--border);font-family:'Segoe UI',sans-serif">
                <div style="display:flex;justify-content:space-between">
                    <strong style="font-size:13px">${i.title}</strong>
                    <span class="badge badge-${i.status === 'Resolved' ? 'connected' : 'notconnected'}">${i.status}</span>
                </div>
                <p style="font-size:12px;color:var(--text-muted);margin-top:4px">${i.description || ''}</p>
                <p style="font-size:11px;color:var(--text-muted);margin-top:4px">Reported by ${i.reported_by} — ${new Date(i.created_at).toLocaleDateString()}</p>
                ${i.status === 'Open' ? `<button class="btn btn-outline btn-sm" style="margin-top:6px" onclick="resolveIssue(${i.id})">Mark Resolved</button>` : ''}
            </div>
        `).join('')
        : '<p style="color:var(--text-muted);font-size:13px;font-family:Segoe UI,sans-serif">No issues reported for this institution.</p>';

    window.currentProfileInstitutionId = id;

    // Load files for this institution
    const filesResult = await apiGet(`/api/files/${id}`);
    const filesDiv = document.getElementById('profileFiles');
    if (filesResult.success && filesResult.data.length > 0) {
        filesDiv.innerHTML = filesResult.data.map(f => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-family:'Segoe UI',sans-serif;font-size:12.5px">
                <div>
                    <strong>${f.filename}</strong>
                    <div style="font-size:11px;color:var(--text-muted)">${f.description || 'No description'} — uploaded by ${f.uploaded_by}</div>
                </div>
                <span style="font-size:11px;color:var(--text-muted)">${new Date(f.uploaded_at).toLocaleDateString()}</span>
            </div>
        `).join('');
    } else {
        filesDiv.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);font-family:Segoe UI,sans-serif">No files uploaded yet.</p>';
    }

    // Mini map
    const mapDiv = document.getElementById('profileMap');
    mapDiv.innerHTML = '';
    if (inst.lat && inst.lng && Math.abs(inst.lat) < 90 && Math.abs(inst.lng) < 90) {
        setTimeout(() => {
            const m = L.map('profileMap').setView([inst.lat, inst.lng], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(m);
            L.marker([inst.lat, inst.lng]).addTo(m).bindPopup(`<b>${inst.name}</b>`).openPopup();
        }, 150);
    } else {
        mapDiv.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);font-family:Segoe UI,sans-serif;font-size:13px">No GPS coordinates available.</div>';
    }
}

// ================================
// ADD / EDIT MODAL
// ================================
function openInstitutionModal(id) {
    editId = id || null;
    document.getElementById('institutionModalTitle').textContent = id ? 'Edit Institution' : 'Add Institution';
    switchModalTab('inst', 'instTabBasic');

    if (id) {
        const inst = allInstitutions.find(x => x.id === id);
        if (!inst) return;
        document.getElementById('fName').value = inst.name;
        document.getElementById('fNemis').value = inst.nemis;
        document.getElementById('fType').value = inst.type || 'Public';
        document.getElementById('fCounty').value = inst.county;
        document.getElementById('fSubCounty').value = inst.sub_county;
        document.getElementById('fConstituency').value = inst.constituency || '';
        document.getElementById('fWard').value = inst.ward || '';
        document.getElementById('fZone').value = inst.zone || '';
        document.getElementById('fCategory').value = inst.category || 'School';
        document.getElementById('fProject').value = inst.project || '';
        document.getElementById('fLat').value = inst.lat || '';
        document.getElementById('fLng').value = inst.lng || '';
        document.getElementById('fIpAddress').value = inst.ip_address || '';
        document.getElementById('fNoAP').value = inst.no_of_access_points || '';
        document.getElementById('fStatus').value = inst.status;
        document.getElementById('fStatusDetail').value = inst.status_detail || '';
        document.getElementById('fComments').value = inst.comments || '';
    } else {
        ['fName','fNemis','fSubCounty','fConstituency','fWard','fZone','fCategory','fProject',
         'fLat','fLng','fIpAddress','fNoAP','fStatusDetail','fComments'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('fType').value = 'Public';
        document.getElementById('fCategory').value = 'School';
        document.getElementById('fStatus').value = 'Not Connected';
    }

    document.getElementById('institutionModal').classList.add('open');
}

function closeInstitutionModal() {
    document.getElementById('institutionModal').classList.remove('open');
}

async function saveInstitution() {
    const name = document.getElementById('fName').value.trim();
    const nemis = document.getElementById('fNemis').value.trim();

    if (!name || !nemis) {
        toast('Institution name and NEMIS code are required', 'error');
        return;
    }

    const data = {
        name: name.toUpperCase(),
        nemis: nemis.toUpperCase(),
        type: document.getElementById('fType').value,
        county: document.getElementById('fCounty').value,
        subCounty: document.getElementById('fSubCounty').value.trim().toUpperCase(),
        constituency: document.getElementById('fConstituency').value.trim(),
        ward: document.getElementById('fWard').value.trim(),
        zone: document.getElementById('fZone').value.trim().toUpperCase(),
        category: document.getElementById('fCategory').value.trim(),
        project: document.getElementById('fProject').value.trim(),
        region: 'North Rift',
        lat: parseFloat(document.getElementById('fLat').value) || null,
        lng: parseFloat(document.getElementById('fLng').value) || null,
        ipAddress: document.getElementById('fIpAddress').value.trim(),
        noOfAccessPoints: parseInt(document.getElementById('fNoAP').value) || 0,
        status: document.getElementById('fStatus').value,
        statusDetail: document.getElementById('fStatusDetail').value.trim(),
        comments: document.getElementById('fComments').value.trim()
    };

    const result = editId
        ? await apiPut(`/api/institutions/${editId}`, data)
        : await apiPost('/api/institutions', data);

    if (result.success) {
        toast(editId ? 'Institution updated' : 'Institution added', 'success');
        closeInstitutionModal();
        if (data.ipAddress) {
            await triggerAutoMonitoring();
        } else {
            await loadRegistry();
            renderDashboard();
        }
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

async function deleteInstitution(id) {
    if (!confirm('Delete this institution? This cannot be undone.')) return;
    const result = await apiDelete(`/api/institutions/${id}`);
    if (result.success) {
        toast('Institution deleted', 'success');
        await loadRegistry();
        renderDashboard();
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

function exportCSV() {
    const headers = ['ID','Name','NEMIS','County','Sub-County','Zone','Type','Status','Status Detail','Latitude','Longitude'];
    const rows = filteredInstitutions.map(i => [
        i.id, i.name, i.nemis, i.county, i.sub_county, i.zone || '', i.type, i.status, i.status_detail || '', i.lat || '', i.lng || ''
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'institution_connectivity_monitoring.csv';
    a.click();
    toast('CSV exported', 'success');
}

function openImportModal() {
    document.getElementById('importModal').classList.add('open');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('open');
    document.getElementById('importFileInput').value = '';
}

async function handleBulkImport() {
    const importFile = document.getElementById('importFileInput');
    if (!importFile.files[0]) {
        toast('Please choose a CSV file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', importFile.files[0]);
    const result = await apiImportInstitutions(formData);

    if (result.success) {
        toast(`Import completed: ${result.imported} added, ${result.updated} updated`, 'success');
        closeImportModal();
        await triggerAutoMonitoring();
    } else {
        toast('Import failed: ' + result.error, 'error');
    }
}

// ================================
// FILE UPLOAD — wired to real Flask endpoint
// ================================
function openUploadModal() {
    document.getElementById('uploadModal').classList.add('open');
}
function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('open');
    document.getElementById('fileInput').value = '';
    document.getElementById('fileDescription').value = '';
}

async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const institutionId = document.getElementById('uploadInstitution').value;
    const description = document.getElementById('fileDescription').value.trim();

    if (!fileInput.files[0]) {
        toast('Please choose a file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    if (institutionId) formData.append('institutionId', institutionId);
    formData.append('description', description);

    const result = await apiUploadFile(formData);

    if (result.success) {
        toast('File uploaded successfully: ' + result.filename, 'success');
        closeUploadModal();
        if (window.currentProfileInstitutionId) viewProfile(window.currentProfileInstitutionId);
    } else {
        toast('Upload failed: ' + result.error, 'error');
    }
}

async function renderIpStatusMonitor() {
    const result = await apiGet('/api/institutions/ip-status');
    const tbody = document.getElementById('ipStatusTable');
    if (!tbody) return;

    if (!result.success) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--status-not-connected)">${result.error || 'Unable to load IP monitor.'}</td></tr>`;
        return;
    }

    tbody.innerHTML = (result.data || []).map((inst, idx) => `
        <tr>
            <td style="color:var(--text-muted)">${idx + 1}</td>
            <td><strong>${inst.name}</strong></td>
            <td>${inst.county || '—'}</td>
            <td>${inst.sub_county || '—'}</td>
            <td><code>${inst.ip_address || '—'}</code></td>
            <td><span class="badge badge-${inst.status.toLowerCase().replace(/ /g,'')}">${inst.status}</span></td>
            <td>${getFreshnessHtml(inst.last_verified_at)}</td>
            <td>${inst.status_detail || '—'}</td>
        </tr>
    `).join('');
}

async function triggerAutoMonitoring() {
    const result = await apiRunMonitor();
    if (result.success) {
        toast('Connectivity scan completed', 'success');
        await loadRegistry();
        renderDashboard();
        renderIpStatusMonitor();
    } else {
        toast('Monitoring failed: ' + result.error, 'error');
    }
}

// Load registry on script load (dashboard.html includes this script on every load)
loadRegistry();
// ================================
// EQUIPMENT INVENTORY
// ================================
function showEquipmentForm() {
    const form = document.getElementById('equipmentForm');
    const saveBtn = document.getElementById('btnSaveEquipment');
    const addBtn = document.getElementById('btnAddEquipment');
    if (!form || !saveBtn || !addBtn) return;

    form.style.display = 'grid';
    saveBtn.style.display = 'inline-flex';
    addBtn.style.display = 'none';
}

async function loadEquipmentList(institutionId) {
    const list = document.getElementById('equipmentList');
    if (!list) return;

    const result = await apiGet(`/api/equipment/${institutionId}`);
    if (!result.success || result.data.length === 0) {
        list.innerHTML = '<p style="font-size:12.5px;color:var(--text-muted);font-family:Segoe UI,sans-serif">No equipment recorded yet.</p>';
        return;
    }
    list.innerHTML = result.data.map(eq => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-family:'Segoe UI',sans-serif;font-size:12.5px">
            <div>
                <strong>${eq.equipment_type}</strong> — ${eq.model_oem || '—'}
                <div style="font-size:11px;color:var(--text-muted)">Serial: ${eq.serial_no || '—'}</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removeEquipmentItem(${eq.id}, ${institutionId})">Remove</button>
        </div>
    `).join('');
}

async function addEquipmentItem() {
    const form = document.getElementById('equipmentForm');
    const saveBtn = document.getElementById('btnSaveEquipment');
    const addBtn = document.getElementById('btnAddEquipment');
    if (!form || !saveBtn || !addBtn) return;

    const result = await apiPost('/api/equipment', {
        institutionId: editId,
        equipmentType: document.getElementById('eqType').value,
        modelOem: document.getElementById('eqModel').value.trim(),
        serialNo: document.getElementById('eqSerial').value.trim(),
        notes: document.getElementById('eqNotes').value.trim()
    });

    if (result.success) {
        toast('Equipment added', 'success');
        ['eqModel','eqSerial','eqNotes'].forEach(i => document.getElementById(i).value = '');
        form.style.display = 'none';
        saveBtn.style.display = 'none';
        addBtn.style.display = 'inline-flex';
        loadEquipmentList(editId);
    } else {
        toast('Error: ' + result.error, 'error');
    }
}

async function removeEquipmentItem(equipmentId, institutionId) {
    if (!confirm('Remove this equipment record?')) return;
    const result = await apiDelete(`/api/equipment/${equipmentId}`);
    if (result.success) {
        loadEquipmentList(institutionId);
    } else {
        toast('Error: ' + result.error, 'error');
    }
}