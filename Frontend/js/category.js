/* ============================================================
   CATEGORIES — CRUD with grid/table toggle
   ============================================================ */

var API_BASE = '/api';
let categories = [];
let currentView = 'table';
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;
  await loadCategories();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-add-category').addEventListener('click', openAddForm);
  document.getElementById('category-form').addEventListener('submit', handleSubmit);
  document.getElementById('view-grid').addEventListener('click', () => setView('grid'));
  document.getElementById('view-table').addEventListener('click', () => setView('table'));
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      categories = data.categories;
      renderCategories();
    }
  } catch (err) {
    showToast('Failed to load categories', 'error');
  }
}

function renderCategories() {
  const grid = document.getElementById('categories-grid');
  const tbody = document.getElementById('categories-table-body');

  if (categories.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No categories</h3><p>Add your first category</p></div>';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">No categories found</td></tr>';
    return;
  }

  grid.innerHTML = categories.map(c => `
    <div class="collection-card" onclick="openEditForm(${c.id})">
      <div class="card-body">
        <div class="card-name">${escapeHtml(c.name)}</div>
        <div class="card-footer" style="margin-top:8px;">
          <span class="mono" style="color:var(--primary);">${c.product_count} products</span>
          <span class="mono" style="font-size:0.73rem;color:#888;">${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>`).join('');

  tbody.innerHTML = categories.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${escapeHtml(c.name)}</td>
      <td>${c.product_count}</td>
      <td class="actions-cell">
        <button class="btn btn-ghost btn-sm" onclick="openEditForm(${c.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCategory(${c.id})" style="color:var(--danger);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>`).join('');
}

function setView(view) {
  currentView = view;
  document.getElementById('view-grid').classList.toggle('active', view === 'grid');
  document.getElementById('view-table').classList.toggle('active', view === 'table');
  document.getElementById('categories-grid').classList.toggle('hidden', view !== 'grid');
  document.getElementById('categories-table').classList.toggle('hidden', view !== 'table');
}

function openAddForm() {
  editingId = null;
  document.getElementById('panel-title').textContent = 'Add Category';
  document.getElementById('category-form').reset();
  openPanel('category-panel');
}

function openEditForm(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  editingId = cat.id;
  document.getElementById('panel-title').textContent = 'Edit Category';
  document.getElementById('category-name').value = cat.name;
  openPanel('category-panel');
}

async function handleSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('category-name').value.trim();
  if (!name) return showToast('Category name is required', 'error');

  try {
    const url = editingId ? `${API_BASE}/categories/${editingId}` : `${API_BASE}/categories`;
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closePanel('category-panel');
      loadCategories();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save category', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) { showToast('Category deleted', 'success'); loadCategories(); }
    else showToast(data.message, 'error');
  } catch (err) { showToast('Failed to delete', 'error'); }
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
