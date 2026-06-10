// ================================
// SCHOOL REGISTRY
// ================================

let editId = null;
let currentPage = 1;
const PAGE_SIZE = 5;
let filtered = [...SCHOOLS];

// ================================
// RENDER TABLE
// ================================
function renderTable() {
    const total = filtered.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filtered.slice(start, start + PAGE_SIZE);

    // Show or hide no results
    document.getElementById('noResults').style.display = 
        total === 0 ? 'block' : 'none';

    // Build table rows
    const tbody = document.getElementById('registryBody');
    tbody.innerHTML = '';

    pageData.forEach(function(school) {

        // Badge class
        let badgeClass = 'badge-unknown';
        if(school.status === 'Connected') 
            badgeClass = 'badge-connected';
        if(school.status === 'Scheduled') 
            badgeClass = 'badge-scheduled';
        if(school.status === 'Not Connected') 
            badgeClass = 'badge-notconnected';

        tbody.innerHTML += `
            <tr>
                <td>${school.id}</td>
                <td><strong>${school.name}</strong></td>
                <td>${school.nemis}</td>
                <td>${school.county}</td>
                <td>${school.subCounty}</td>
                <td>${school.type}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${school.status}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" 
                    onclick="openEditModal(${school.id})">
                        Edit
                    </button>
                    <button class="btn-delete" 
                    onclick="deleteSchool(${school.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    // Pagination info
    document.getElementById('pgInfo').textContent = 
        `Showing ${Math.min(start+1, total)}–
        ${Math.min(start + PAGE_SIZE, total)} 
        of ${total} records`;

    // Pagination buttons
    const pgBtns = document.getElementById('pgBtns');
    pgBtns.innerHTML = '';

    for(let i = 1; i <= totalPages; i++) {
        pgBtns.innerHTML += `
            <button 
                class="pg-btn ${i === currentPage ? 'active' : ''}" 
                onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }
}

// ================================
// GO TO PAGE
// ================================
function goToPage(page) {
    currentPage = page;
    renderTable();
}

// ================================
// SEARCH AND FILTER
// ================================
function searchSchools() {
    const query = document.getElementById('searchBox')
        .value.toLowerCase();
    const county = document.getElementById('filterCounty').value;
    const status = document.getElementById('filterStatus').value;

    filtered = SCHOOLS.filter(function(school) {
        const matchQuery = !query || 
            school.name.toLowerCase().includes(query) || 
            school.nemis.toLowerCase().includes(query);
        const matchCounty = !county || school.county === county;
        const matchStatus = !status || school.status === status;
        return matchQuery && matchCounty && matchStatus;
    });

    currentPage = 1;
    renderTable();
}

// ================================
// OPEN ADD MODAL
// ================================
function openAddModal() {
    editId = null;
    document.getElementById('modalTitle').textContent = 'Add School';
    document.getElementById('fName').value = '';
    document.getElementById('fNemis').value = '';
    document.getElementById('fSubCounty').value = '';
    document.getElementById('fZone').value = '';
    document.getElementById('fStatusDetail').value = '';
    document.getElementById('fLat').value = '';
    document.getElementById('fLng').value = '';
    document.getElementById('schoolModal').classList.add('open');
}

// ================================
// OPEN EDIT MODAL
// ================================
function openEditModal(id) {
    editId = id;
    const school = SCHOOLS.find(s => s.id === id);
    document.getElementById('modalTitle').textContent = 'Edit School';
    document.getElementById('fName').value = school.name;
    document.getElementById('fNemis').value = school.nemis;
    document.getElementById('fType').value = school.type;
    document.getElementById('fCounty').value = school.county;
    document.getElementById('fSubCounty').value = school.subCounty;
    document.getElementById('fZone').value = school.zone;
    document.getElementById('fStatus').value = school.status;
    document.getElementById('fStatusDetail').value = school.statusDetail;
    document.getElementById('fLat').value = school.lat || '';
    document.getElementById('fLng').value = school.lng || '';
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
    if(!name) {
        alert('School name is required');
        return;
    }

    if(editId) {
        // Edit existing school
        const index = SCHOOLS.findIndex(s => s.id === editId);
        SCHOOLS[index].name = name.toUpperCase();
        SCHOOLS[index].nemis = document.getElementById('fNemis')
            .value.trim();
        SCHOOLS[index].type = document.getElementById('fType').value;
        SCHOOLS[index].county = document.getElementById('fCounty')
            .value;
        SCHOOLS[index].subCounty = document.getElementById('fSubCounty')
            .value.trim();
        SCHOOLS[index].zone = document.getElementById('fZone')
            .value.trim();
        SCHOOLS[index].status = document.getElementById('fStatus')
            .value;
        SCHOOLS[index].statusDetail = document
            .getElementById('fStatusDetail').value.trim();
        SCHOOLS[index].lat = parseFloat(
            document.getElementById('fLat').value) || null;
        SCHOOLS[index].lng = parseFloat(
            document.getElementById('fLng').value) || null;
    } else {
        // Add new school
        const newSchool = {
            id: SCHOOLS.length + 1,
            name: name.toUpperCase(),
            nemis: document.getElementById('fNemis').value.trim(),
            type: document.getElementById('fType').value,
            county: document.getElementById('fCounty').value,
            subCounty: document.getElementById('fSubCounty')
                .value.trim(),
            zone: document.getElementById('fZone').value.trim(),
            status: document.getElementById('fStatus').value,
            statusDetail: document.getElementById('fStatusDetail')
                .value.trim(),
            lat: parseFloat(
                document.getElementById('fLat').value) || null,
            lng: parseFloat(
                document.getElementById('fLng').value) || null,
        };
        SCHOOLS.unshift(newSchool);
    }

    closeModal();
    filtered = [...SCHOOLS];
    renderTable();
}

// ================================
// DELETE SCHOOL
// ================================
function deleteSchool(id) {
    if(!confirm('Delete this school? This cannot be undone.')) return;
    const index = SCHOOLS.findIndex(s => s.id === id);
    SCHOOLS.splice(index, 1);
    filtered = [...SCHOOLS];
    renderTable();
}

// ================================
// START
// ================================
renderTable();