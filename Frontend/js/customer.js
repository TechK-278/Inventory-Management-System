/* ============================================================
   CUSTOMERS — CRUD with table/grid toggle
   ============================================================ */

var API_BASE = '/api';
let customers = [];
let currentView = 'table';
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;
  await loadCustomers();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-add-customer').addEventListener('click', openAddForm);
  document.getElementById('customer-form').addEventListener('submit', handleSubmit);
  document.getElementById('view-grid').addEventListener('click', () => setView('grid'));
  document.getElementById('view-table').addEventListener('click', () => setView('table'));
}

async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/customers`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) { customers = data.customers; renderCustomers(); }
  } catch (err) { showToast('Failed to load customers', 'error'); }
}

function renderCustomers() {
  const grid = document.getElementById('customers-grid');
  const tbody = document.getElementById('customers-table-body');

  if (customers.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No customers</h3><p>Add your first customer</p></div>';
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">No customers found</td></tr>';
    return;
  }

  grid.innerHTML = customers.map(c => `
    <div class="collection-card" onclick="openEditForm(${c.id})">
      <div class="card-body">
        <div class="card-name">${escapeHtml(c.name)}</div>
        <div class="card-footer" style="margin-top:8px;">
          <span class="mono" style="color:var(--primary);">${c.sales_count} orders</span>
          <span class="mono" style="font-size:0.73rem;">${c.phone || '—'}</span>
        </div>
      </div>
    </div>`).join('');

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${escapeHtml(c.name)}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.sales_count}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditForm(${c.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCustomer(${c.id})" style="color:var(--danger);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>`).join('');
}

function setView(v) {
  currentView = v;
  document.getElementById('view-grid').classList.toggle('active', v === 'grid');
  document.getElementById('view-table').classList.toggle('active', v === 'table');
  document.getElementById('customers-grid').classList.toggle('hidden', v !== 'grid');
  document.getElementById('customers-table').classList.toggle('hidden', v !== 'table');
}

function openAddForm() {
  editingId = null;
  document.getElementById('panel-title').textContent = 'Add Customer';
  document.getElementById('customer-form').reset();
  openPanel('customer-panel');
}

function openEditForm(id) {
  const c = customers.find(x => x.id === id);
  if (!c) return;
  editingId = c.id;
  document.getElementById('panel-title').textContent = 'Edit Customer';
  document.getElementById('customer-name').value = c.name;
  document.getElementById('customer-phone').value = c.phone || '';
  document.getElementById('customer-email').value = c.email || '';
  document.getElementById('customer-address').value = c.address || '';
  openPanel('customer-panel');
}

async function handleSubmit(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    email: document.getElementById('customer-email').value.trim(),
    address: document.getElementById('customer-address').value.trim()
  };
  if (!body.name) return showToast('Customer name is required', 'error');

  try {
    const url = editingId ? `${API_BASE}/customers/${editingId}` : `${API_BASE}/customers`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { showToast(data.message, 'success'); closePanel('customer-panel'); loadCustomers(); }
    else showToast(data.message, 'error');
  } catch (err) { showToast('Failed to save customer', 'error'); }
}

async function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return;
  try {
    const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Customer deleted', 'success'); loadCustomers(); }
    else showToast(data.message, 'error');
  } catch (err) { showToast('Failed to delete', 'error'); }
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
