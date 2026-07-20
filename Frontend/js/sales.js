/* ============================================================
   SALES — Two-column line-item builder with stock validation
   ============================================================ */

var API_BASE = '/api';
let products = [];
let customers = [];
let saleItems = [];
let sales = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;

  await Promise.all([loadProducts(), loadCustomers(), loadSales()]);
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('btn-new-sale').addEventListener('click', () => {
    document.getElementById('sales-builder').classList.remove('hidden');
    document.getElementById('sales-history').classList.add('hidden');
  });
  document.getElementById('btn-back-to-list').addEventListener('click', () => {
    document.getElementById('sales-builder').classList.add('hidden');
    document.getElementById('sales-history').classList.remove('hidden');
    saleItems = [];
    renderReceipt();
  });
  document.getElementById('btn-add-item').addEventListener('click', addItem);
  document.getElementById('btn-submit-sale').addEventListener('click', submitSale);

  // Auto-fill price
  document.getElementById('item-product').addEventListener('change', function() {
    const option = this.options[this.selectedIndex];
    if (option && option.dataset.price) {
      document.getElementById('item-price').value = option.dataset.price;
    }
  });
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
        select.innerHTML += `<option value="${p.id}" data-price="${p.selling_price}" data-stock="${p.quantity}">${p.name} (Stock: ${p.quantity})</option>`;
      });
    }
  } catch (err) { console.error(err); }
}

async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/customers`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      customers = data.customers;
      const select = document.getElementById('sale-customer');
      select.innerHTML = '<option value="">Walk-in customer</option>';
      customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      });
    }
  } catch (err) { console.error(err); }
}

async function loadSales() {
  try {
    const res = await fetch(`${API_BASE}/sales`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      sales = data.sales;
      renderSalesHistory();
    }
  } catch (err) { console.error(err); }
}

function renderSalesHistory() {
  const tbody = document.getElementById('sales-table-body');
  if (sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">No sales yet</td></tr>';
    return;
  }
  tbody.innerHTML = sales.map(s => `
    <tr>
      <td>#${s.id}</td>
      <td>${s.customer_name || 'Walk-in'}</td>
      <td>₹${parseFloat(s.total_amount).toLocaleString()}</td>
      <td>${s.items ? s.items.length : 0} items</td>
      <td>${new Date(s.sale_date).toLocaleDateString()}</td>
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

  // Stock validation
  const alreadyAdded = saleItems.filter(i => i.product_id === productId).reduce((sum, i) => sum + i.quantity, 0);
  if (alreadyAdded + quantity > product.quantity) {
    return showToast(`Insufficient stock for "${product.name}". Available: ${product.quantity - alreadyAdded}`, 'warning');
  }

  const existing = saleItems.find(i => i.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
    existing.price = price;
  } else {
    saleItems.push({ product_id: productId, product_name: product.name, quantity, price });
  }

  select.value = '';
  qtyInput.value = '1';
  priceInput.value = '';
  renderReceipt();
}

function removeItem(idx) {
  saleItems.splice(idx, 1);
  renderReceipt();
}

function renderReceipt() {
  const container = document.getElementById('receipt-items');
  const totalEl = document.getElementById('receipt-total-amount');

  if (saleItems.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#888;padding:16px;font-size:0.8rem;">No items added</div>';
    totalEl.textContent = '₹0.00';
    return;
  }

  let total = 0;
  container.innerHTML = saleItems.map((item, idx) => {
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

async function submitSale() {
  if (saleItems.length === 0) return showToast('Add at least one item', 'error');

  const customer_id = document.getElementById('sale-customer').value || null;

  try {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id,
        items: saleItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price
        }))
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      saleItems = [];
      renderReceipt();
      document.getElementById('sales-builder').classList.add('hidden');
      document.getElementById('sales-history').classList.remove('hidden');
      await Promise.all([loadSales(), loadProducts()]);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to create sale', 'error');
  }
}
