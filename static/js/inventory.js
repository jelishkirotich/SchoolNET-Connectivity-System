let inventoryEditId = null;

async function renderInventory() {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">Loading inventory...</td></tr>';

    const result = await apiGet('/api/inventory');
    if (!result.success) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--status-not-connected)">${result.error || 'Unable to load inventory.'}</td></tr>`;
        return;
    }

    const rows = result.data || [];
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No inventory records yet.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <strong>${item.school_code || '—'}</strong><br>
                    <span style="color:var(--text-muted)">${item.institution_name || item.institution_id || '—'}</span>
                </div>
            </td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <strong>${item.head_of_institution_name || '—'}</strong><br>
                    <span style="color:var(--text-muted)">${item.head_of_institution_contact || '—'}</span>
                </div>
            </td>
            <td>${item.serial_no || '—'}</td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <strong>${item.equipment_type || '—'}</strong><br>
                    <span style="color:var(--text-muted)">${item.equipment_name || '—'}</span><br>
                    <span>Model: ${item.model_oem || '—'}</span><br>
                    <span>Serial: ${item.equipment_serial_no || '—'}</span><br>
                    <span>Qty: ${item.equipment_quantity || 1}</span><br>
                    <span>Status: ${item.equipment_status || 'Pending'}</span>
                </div>
            </td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <strong>${item.delivery_status || 'Pending'}</strong><br>
                    <span style="color:var(--text-muted)">${item.delivery_date || '—'}</span>
                </div>
            </td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <strong>${item.inspection_status || 'Not Taken'}</strong><br>
                    <span style="color:var(--text-muted)">${item.inspection_date || '—'}</span>
                </div>
            </td>
            <td>
                <div style="font-size:12px;line-height:1.45">
                    <span style="color:var(--text-muted)">${item.equipment_notes || 'No notes'}</span>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadInventoryInstitutions() {
    const select = document.getElementById('inventoryInstitution');
    if (!select) return;

    const result = await apiGet('/api/institutions');
    if (!result.success) return;

    select.innerHTML = '<option value="">-- Select Institution --</option>' + (result.data || []).map(inst => `<option value="${inst.id}">${inst.name} (${inst.nemis || 'No NEMIS'})</option>`).join('');
}

function switchInventorySection(section) {
    document.querySelectorAll('.inventory-section-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.inventory-section').forEach(panel => panel.classList.remove('active'));
    document.querySelector(`[onclick="switchInventorySection('${section}')"]`)?.classList.add('active');
    document.getElementById(`inventory-section-${section}`)?.classList.add('active');
}

function openInventoryModal() {
    inventoryEditId = null;
    document.getElementById('inventoryModalTitle').textContent = 'Add Inventory Record';
    document.querySelectorAll('#inventoryModal input, #inventoryModal select, #inventoryModal textarea').forEach(el => {
        if (el.type === 'date') el.value = '';
        else if (el.tagName === 'SELECT') el.value = el.options[0]?.value || '';
        else el.value = '';
    });
    switchInventorySection('school');
    const modal = document.getElementById('inventoryModal');
    modal.classList.add('show');
    modal.classList.add('open');
    loadInventoryInstitutions();
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    modal.classList.remove('show');
    modal.classList.remove('open');
}

async function saveInventory() {
    const payload = {
        institutionId: document.getElementById('inventoryInstitution').value || null,
        schoolCode: document.getElementById('inventorySchoolCode').value.trim(),
        headOfInstitutionName: document.getElementById('inventoryHeadName').value.trim(),
        headOfInstitutionContact: document.getElementById('inventoryHeadContact').value.trim(),
        serialNo: document.getElementById('inventorySerialNo').value.trim(),
        equipmentType: document.getElementById('inventoryEquipmentType').value.trim(),
        equipmentName: document.getElementById('inventoryEquipmentName').value.trim(),
        equipmentModel: document.getElementById('inventoryEquipmentModel').value.trim(),
        equipmentSerial: document.getElementById('inventoryEquipmentSerial').value.trim(),
        equipmentQuantity: document.getElementById('inventoryEquipmentQuantity').value || 1,
        equipmentStatus: document.getElementById('inventoryEquipmentStatus').value,
        equipmentNotes: document.getElementById('inventoryEquipmentNotes').value.trim(),
        deliveryStatus: document.getElementById('inventoryDeliveryStatus').value,
        deliveryDate: document.getElementById('inventoryDeliveryDate').value,
        inspectionStatus: document.getElementById('inventoryInspectionStatus').value,
        inspectionDate: document.getElementById('inventoryInspectionDate').value
    };

    const result = inventoryEditId
        ? await apiPut(`/api/inventory/${inventoryEditId}`, payload)
        : await apiPost('/api/inventory', payload);

    if (!result.success) {
        toast(result.error || 'Unable to save inventory record', 'error');
        return;
    }

    toast(result.message || 'Inventory saved', 'success');
    closeInventoryModal();
    renderInventory();
}

async function editInventory(id) {
    const result = await apiGet('/api/inventory');
    if (!result.success) return;
    const record = (result.data || []).find(item => item.id === id);
    if (!record) return;

    inventoryEditId = id;
    document.getElementById('inventoryModalTitle').textContent = 'Edit Inventory Record';
    document.getElementById('inventoryInstitution').value = record.institution_id || '';
    document.getElementById('inventorySchoolCode').value = record.school_code || '';
    document.getElementById('inventoryHeadName').value = record.head_of_institution_name || '';
    document.getElementById('inventoryHeadContact').value = record.head_of_institution_contact || '';
    document.getElementById('inventorySerialNo').value = record.serial_no || '';
    document.getElementById('inventoryDeliveryStatus').value = record.delivery_status || 'Pending';
    document.getElementById('inventoryDeliveryDate').value = record.delivery_date || '';
    document.getElementById('inventoryInspectionStatus').value = record.inspection_status || 'Not Taken';
    document.getElementById('inventoryInspectionDate').value = record.inspection_date || '';
    switchInventorySection('school');
    const modal = document.getElementById('inventoryModal');
    modal.classList.add('show');
    modal.classList.add('open');
    loadInventoryInstitutions();
}

async function deleteInventory(id) {
    if (!confirm('Delete this inventory record?')) return;
    const result = await apiDelete(`/api/inventory/${id}`);
    if (!result.success) {
        toast(result.error || 'Unable to delete inventory record', 'error');
        return;
    }
    toast(result.message || 'Inventory deleted', 'success');
    renderInventory();
}

window.addEventListener('DOMContentLoaded', () => {
    renderInventory();
    loadInventoryInstitutions();
});
