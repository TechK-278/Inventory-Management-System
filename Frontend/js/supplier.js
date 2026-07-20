/* ============================================================
   SUPPLIERS — CRUD with table/grid toggle
   ============================================================ */

var API_BASE = '/api';
let suppliers = [];
let currentView = 'table';
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;
  await loadSuppliers();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-add-supplier').addEventListener('click', openAddForm);
  document.getElementById('supplier-form').addEventListener('submit', handleSubmit);
  document.getElementById('view-grid').addEventListener('click', () => setView('grid'));
  document.getElementById('view-table').addEventListener('click', () => setView('table'));
}

async function loadSuppliers() {
  try {
    const res = await fetch(`${API_BASE}/suppliers`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) { suppliers = data.suppliers; renderSuppliers(); }
  } catch (err) { showToast('Failed to load suppliers', 'error'); }
}

function renderSuppliers() {
  const grid = document.getElementById('suppliers-grid');
  const tbody = document.getElementById('suppliers-table-body');

  if (suppliers.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No suppliers</h3><p>Add your first supplier</p></div>';
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No suppliers found</td></tr>';
    return;
  }

  grid.innerHTML = suppliers.map(s => `
    <div class="collection-card" onclick="openEditForm(${s.id})">
      <div class="card-body">
        <div class="card-name">${escapeHtml(s.name)}</div>
        ${s.company ? `<span class="card-category">${escapeHtml(s.company)}</span>` : ''}
        <div class="card-footer" style="margin-top:8px;">
          <span class="mono" style="color:var(--primary);">${s.product_count} products</span>
          <span class="mono" style="font-size:0.73rem;">${s.phone || '—'}</span>
        </div>
      </div>
    </div>`).join('');

  tbody.innerHTML = suppliers.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.company || '—')}</td>
      <td>${s.phone || '—'}</td>
      <td>${s.product_count}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditForm(${s.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteSupplier(${s.id})" style="color:var(--danger);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>`).join('');
}

function setView(v) {
  currentView = v;
  document.getElementById('view-grid').classList.toggle('active', v === 'grid');
  document.getElementById('view-table').classList.toggle('active', v === 'table');
  document.getElementById('suppliers-grid').classList.toggle('hidden', v !== 'grid');
  document.getElementById('suppliers-table').classList.toggle('hidden', v !== 'table');
}

function openAddForm() {
  editingId = null;
  document.getElementById('panel-title').textContent = 'Add Supplier';
  document.getElementById('supplier-form').reset();
  openPanel('supplier-panel');
}

function openEditForm(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  editingId = s.id;
  document.getElementById('panel-title').textContent = 'Edit Supplier';
  document.getElementById('supplier-name').value = s.name;
  document.getElementById('supplier-company').value = s.company || '';
  document.getElementById('supplier-phone').value = s.phone || '';
  document.getElementById('supplier-email').value = s.email || '';
  document.getElementById('supplier-address').value = s.address || '';
  openPanel('supplier-panel');
}

async function handleSubmit(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('supplier-name').value.trim(),
    company: document.getElementById('supplier-company').value.trim(),
    phone: document.getElementById('supplier-phone').value.trim(),
    email: document.getElementById('supplier-email').value.trim(),
    address: document.getElementById('supplier-address').value.trim()
  };
  if (!body.name) return showToast('Supplier name is required', 'error');

  try {
    const url = editingId ? `${API_BASE}/suppliers/${editingId}` : `${API_BASE}/suppliers`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { showToast(data.message, 'success'); closePanel('supplier-panel'); loadSuppliers(); }
    else showToast(data.message, 'error');
  } catch (err) { showToast('Failed to save supplier', 'error'); }
}

async function deleteSupplier(id) {
  if (!confirm('Delete this supplier?')) return;
  try {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Supplier deleted', 'success'); loadSuppliers(); }
    else showToast(data.message, 'error');
  } catch (err) { showToast('Failed to delete', 'error'); }
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
