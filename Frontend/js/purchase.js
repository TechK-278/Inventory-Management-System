/* ============================================================
   PURCHASE — Two-column line-item builder
   Product picker left, receipt-style summary right
   ============================================================ */

var API_BASE = '/api';
let products = [];
let suppliers = [];
let purchaseItems = [];
let purchases = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;

  await Promise.all([loadProducts(), loadSuppliers(), loadPurchases()]);
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-new-purchase').addEventListener('click', () => {
    document.getElementById('purchase-builder').classList.remove('hidden');
    document.getElementById('purchase-history').classList.add('hidden');
  });
  document.getElementById('btn-back-to-list').addEventListener('click', () => {
    document.getElementById('purchase-builder').classList.add('hidden');
    document.getElementById('purchase-history').classList.remove('hidden');
    purchaseItems = [];
    renderReceipt();
  });
  document.getElementById('btn-add-item').addEventListener('click', addItem);
  document.getElementById('btn-submit-purchase').addEventListener('click', submitPurchase);
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products?limit=1000`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      products = data.products;
      const select = document.getElementById('item-product');
      select.innerHTML = '<option value="">Select product...</option>';
      products.forEach(p => {
        select.innerHTML += `<option value="${p.id}" data-price="${p.purchase_price}">${p.name} (Stock: ${p.quantity})</option>`;
      });
    }
  } catch (err) { console.error(err); }
}

async function loadSuppliers() {
  try {
    const res = await fetch(`${API_BASE}/suppliers`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      suppliers = data.suppliers;
      const select = document.getElementById('purchase-supplier');
      select.innerHTML = '<option value="">Select supplier...</option>';
      suppliers.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
      });
    }
  } catch (err) { console.error(err); }
}

async function loadPurchases() {
  try {
    const res = await fetch(`${API_BASE}/purchases`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      purchases = data.purchases;
      renderPurchaseHistory();
    }
  } catch (err) { console.error(err); }
}

function renderPurchaseHistory() {
  const tbody = document.getElementById('purchases-table-body');
  if (purchases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No purchases yet</td></tr>';
    return;
  }
  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td>#${p.id}</td>
      <td>${p.supplier_name || 'Unknown'}</td>
      <td>₹${parseFloat(p.total_amount).toLocaleString()}</td>
      <td>${p.items ? p.items.length : 0} items</td>
      <td>${new Date(p.purchase_date).toLocaleDateString()}</td>
    </tr>`).join('');
}

function addItem() {
  const select = document.getElementById('item-product');
  const qtyInput = document.getElementById('item-qty');
  const priceInput = document.getElementById('item-price');

  const productId = parseInt(select.value);
  const quantity = parseInt(qtyInput.value);
  const price = parseFloat(priceInput.value);

  if (!productId) return showToast('Select a product', 'error');
  if (!quantity || quantity <= 0) return showToast('Enter valid quantity', 'error');
  if (!price || price < 0) return showToast('Enter valid price', 'error');

  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Check if already added
  const existing = purchaseItems.find(i => i.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
    existing.price = price;
  } else {
    purchaseItems.push({ product_id: productId, product_name: product.name, quantity, price });
  }

  select.value = '';
  qtyInput.value = '1';
  priceInput.value = '';
  renderReceipt();
}

function removeItem(idx) {
  purchaseItems.splice(idx, 1);
  renderReceipt();
}

function renderReceipt() {
  const container = document.getElementById('receipt-items');
  const totalEl = document.getElementById('receipt-total-amount');

  if (purchaseItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:16px;font-size:0.8rem;">No items added</div>';
    totalEl.textContent = '₹0.00';
    return;
  }

  let total = 0;
  container.innerHTML = purchaseItems.map((item, idx) => {
    const amount = item.quantity * item.price;
    total += amount;
    return `
      <div class="receipt-item">
        <span class="item-name">${item.product_name}</span>
        <span class="item-qty">×${item.quantity}</span>
        <span class="item-amount">₹${amount.toFixed(2)}</span>
        <button class="item-remove" onclick="removeItem(${idx})">✕</button>
      </div>`;
  }).join('');

  totalEl.textContent = '₹' + total.toFixed(2);
}

async function submitPurchase() {
  if (purchaseItems.length === 0) return showToast('Add at least one item', 'error');

  const supplier_id = document.getElementById('purchase-supplier').value || null;

  try {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplier_id,
        items: purchaseItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price
        }))
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      purchaseItems = [];
      renderReceipt();
      document.getElementById('purchase-builder').classList.add('hidden');
      document.getElementById('purchase-history').classList.remove('hidden');
      await Promise.all([loadPurchases(), loadProducts()]);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to create purchase', 'error');
  }
}

// Auto-fill price when product is selected
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('item-product');
  if (select) {
    select.addEventListener('change', () => {
      const option = select.options[select.selectedIndex];
      if (option && option.dataset.price) {
        document.getElementById('item-price').value = option.dataset.price;
      }
    });
  }
});
