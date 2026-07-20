/* ============================================================
   PRODUCTS — CRUD, grid/table toggle, search, side panel
   ============================================================ */

var API_BASE = '/api';
let currentView = 'grid';
let products = [];
let categories = [];
let suppliers = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;

  await Promise.all([loadCategories(), loadSuppliers()]);
  await loadProducts();
  setupEventListeners();
});

function setupEventListeners() {
  // View toggle
  document.getElementById('view-grid').addEventListener('click', () => setView('grid'));
  document.getElementById('view-table').addEventListener('click', () => setView('table'));

  // Add product button
  document.getElementById('btn-add-product').addEventListener('click', () => openAddForm());

  // Search
  document.getElementById('product-search').addEventListener('input', debounce((e) => {
    loadProducts(e.target.value);
  }, 300));

  // Category filter
  document.getElementById('filter-category').addEventListener('change', (e) => {
    loadProducts(document.getElementById('product-search').value, e.target.value);
  });

  // Form submit
  document.getElementById('product-form').addEventListener('submit', handleSubmit);

  // Image preview
  document.getElementById('product-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:120px;border-radius:var(--radius-sm);">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });
}

async function loadProducts(search = '', category = '') {
  try {
    let url = `${API_BASE}/products?limit=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${category}`;

    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();

    if (data.success) {
      products = data.products;
      renderProducts();
    }
  } catch (err) {
    console.error('Load products error:', err);
    showToast('Failed to load products', 'error');
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      categories = data.categories;
      // Populate filter dropdown
      const filter = document.getElementById('filter-category');
      const formSelect = document.getElementById('product-category');
      categories.forEach(cat => {
        filter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        formSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
      });
    }
  } catch (err) {
    console.error('Load categories error:', err);
  }
}

async function loadSuppliers() {
  try {
    const res = await fetch(`${API_BASE}/suppliers`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      suppliers = data.suppliers;
      const formSelect = document.getElementById('product-supplier');
      suppliers.forEach(sup => {
        formSelect.innerHTML += `<option value="${sup.id}">${sup.name}</option>`;
      });
    }
  } catch (err) {
    console.error('Load suppliers error:', err);
  }
}

function renderProducts() {
  const gridContainer = document.getElementById('products-grid');
  const tableBody = document.getElementById('products-table-body');

  if (products.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h3>No products found</h3>
        <p>Add your first product to get started</p>
      </div>`;
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#888;">No products found</td></tr>';
    return;
  }

  // Grid view
  gridContainer.innerHTML = products.map(p => {
    const stockClass = p.quantity === 0 ? 'out-of-stock' : p.quantity <= p.low_stock_threshold ? 'low-stock' : 'in-stock';
    const stockLabel = p.quantity === 0 ? 'OUT' : p.quantity <= p.low_stock_threshold ? `LOW: ${p.quantity}` : `${p.quantity} in stock`;
    const imgSrc = p.image ? `/uploads/${p.image}` : '';

    return `
      <div class="collection-card" onclick="openEditForm(${p.id})">
        <div class="card-image">
          ${imgSrc ? `<img src="${imgSrc}" alt="${p.name}">` : `<span class="no-image">NO IMAGE</span>`}
        </div>
        <div class="card-body">
          <div class="card-name">${escapeHtml(p.name)}</div>
          ${p.category_name ? `<span class="card-category">${escapeHtml(p.category_name)}</span>` : ''}
          <div class="card-footer">
            <span class="card-price mono">₹${parseFloat(p.selling_price).toLocaleString()}</span>
            <span class="stock-pill ${stockClass}">${stockLabel}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // Table view
  tableBody.innerHTML = products.map(p => {
    const stockClass = p.quantity === 0 ? 'out-of-stock' : p.quantity <= p.low_stock_threshold ? 'low-stock' : 'in-stock';
    return `
      <tr>
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category_name || '—')}</td>
        <td>₹${parseFloat(p.purchase_price).toFixed(2)}</td>
        <td>₹${parseFloat(p.selling_price).toFixed(2)}</td>
        <td><span class="stock-pill ${stockClass}">${p.quantity}</span></td>
        <td>${p.barcode || '—'}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="openEditForm(${p.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteProduct(${p.id})" title="Delete" style="color:var(--danger);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>`;
  }).join('');
}

function setView(view) {
  currentView = view;
  document.getElementById('view-grid').classList.toggle('active', view === 'grid');
  document.getElementById('view-table').classList.toggle('active', view === 'table');
  document.getElementById('products-grid').classList.toggle('hidden', view !== 'grid');
  document.getElementById('products-table').classList.toggle('hidden', view !== 'table');
}

function openAddForm() {
  editingId = null;
  document.getElementById('panel-title').textContent = 'Add Product';
  document.getElementById('product-form').reset();
  document.getElementById('image-preview').innerHTML = '';
  openPanel('product-panel');
}

async function openEditForm(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return;

    const p = data.product;
    editingId = p.id;
    document.getElementById('panel-title').textContent = 'Edit Product';
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-category').value = p.category_id || '';
    document.getElementById('product-supplier').value = p.supplier_id || '';
    document.getElementById('product-purchase-price').value = p.purchase_price;
    document.getElementById('product-selling-price').value = p.selling_price;
    document.getElementById('product-quantity').value = p.quantity;
    document.getElementById('product-barcode').value = p.barcode || '';
    document.getElementById('product-description').value = p.description || '';
    document.getElementById('product-threshold').value = p.low_stock_threshold;

    const preview = document.getElementById('image-preview');
    if (p.image) {
      preview.innerHTML = `<img src="/uploads/${p.image}" style="max-width:100%;max-height:120px;border-radius:var(--radius-sm);">`;
    } else {
      preview.innerHTML = '';
    }

    openPanel('product-panel');
  } catch (err) {
    showToast('Failed to load product', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('name', document.getElementById('product-name').value);
  formData.append('category_id', document.getElementById('product-category').value);
  formData.append('supplier_id', document.getElementById('product-supplier').value);
  formData.append('purchase_price', document.getElementById('product-purchase-price').value);
  formData.append('selling_price', document.getElementById('product-selling-price').value);
  formData.append('quantity', document.getElementById('product-quantity').value);
  formData.append('barcode', document.getElementById('product-barcode').value);
  formData.append('description', document.getElementById('product-description').value);
  formData.append('low_stock_threshold', document.getElementById('product-threshold').value);

  const imageInput = document.getElementById('product-image');
  if (imageInput.files[0]) {
    formData.append('image', imageInput.files[0]);
  }

  try {
    const url = editingId ? `${API_BASE}/products/${editingId}` : `${API_BASE}/products`;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closePanel('product-panel');
      loadProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save product', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();

    if (data.success) {
      showToast('Product deleted', 'success');
      loadProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete product', 'error');
  }
}

// Utilities
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}
