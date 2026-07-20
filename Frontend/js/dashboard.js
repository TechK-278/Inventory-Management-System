/* ============================================================
   DASHBOARD — Fetch summary, render gauges + activity
   ============================================================ */

var API_BASE = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;

  loadDashboard();
});

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { credentials: 'include' });
    const data = await res.json();

    if (!data.success) {
      showToast('Failed to load dashboard', 'error');
      return;
    }

    const s = data.summary;

    // Render gauges
    // Stock Health: % of products that are NOT low-stock
    const stockHealth = s.totalProducts > 0
      ? Math.round(((s.totalProducts - s.lowStockCount) / s.totalProducts) * 100)
      : 100;

    animateGauge(document.getElementById('gauge-stock'), {
      value: stockHealth,
      color: stockHealth > 60 ? 'var(--success)' : stockHealth > 30 ? 'var(--accent)' : 'var(--danger)'
    });
    document.getElementById('gauge-stock-value').textContent = stockHealth + '%';
    document.getElementById('gauge-stock-sub').textContent = `${s.totalProducts - s.lowStockCount}/${s.totalProducts} healthy`;

    // Revenue gauge (arbitrary scale — show as % of 10000 for visual)
    const revTarget = 10000;
    const revPercent = Math.min(100, Math.round((s.todaySales / revTarget) * 100));
    animateGauge(document.getElementById('gauge-revenue'), {
      value: revPercent,
      color: 'var(--primary)'
    });
    document.getElementById('gauge-revenue-value').textContent = '₹' + s.todaySales.toLocaleString();
    document.getElementById('gauge-revenue-sub').textContent = `${s.todaySalesCount} sales today`;

    // Low Stock gauge
    const lowStockPercent = s.totalProducts > 0
      ? Math.round((s.lowStockCount / s.totalProducts) * 100)
      : 0;
    animateGauge(document.getElementById('gauge-lowstock'), {
      value: lowStockPercent,
      color: lowStockPercent > 50 ? 'var(--danger)' : lowStockPercent > 20 ? 'var(--accent)' : 'var(--success)'
    });
    document.getElementById('gauge-lowstock-value').textContent = s.lowStockCount;
    document.getElementById('gauge-lowstock-sub').textContent = 'products below threshold';

    // Summary cards
    document.getElementById('count-products').textContent = s.totalProducts;
    document.getElementById('count-categories').textContent = s.totalCategories;
    document.getElementById('count-suppliers').textContent = s.totalSuppliers;
    document.getElementById('count-customers').textContent = s.totalCustomers;
    document.getElementById('count-today-sales').textContent = '₹' + s.todaySales.toLocaleString();
    document.getElementById('count-today-purchases').textContent = '₹' + s.todayPurchases.toLocaleString();
    document.getElementById('count-low-stock').textContent = s.lowStockCount;
    document.getElementById('count-revenue').textContent = '₹' + s.totalRevenue.toLocaleString();

    // Recent sales
    const salesList = document.getElementById('recent-sales-list');
    salesList.innerHTML = '';
    if (s.recentSales.length === 0) {
      salesList.innerHTML = '<li><span class="activity-label">No recent sales</span></li>';
    } else {
      s.recentSales.forEach(sale => {
        const date = new Date(sale.sale_date).toLocaleDateString();
        salesList.innerHTML += `
          <li>
            <span class="activity-label">${sale.customer_name || 'Walk-in'} <span class="activity-date">${date}</span></span>
            <span class="activity-amount">₹${parseFloat(sale.total_amount).toLocaleString()}</span>
          </li>`;
      });
    }

    // Recent purchases
    const purchasesList = document.getElementById('recent-purchases-list');
    purchasesList.innerHTML = '';
    if (s.recentPurchases.length === 0) {
      purchasesList.innerHTML = '<li><span class="activity-label">No recent purchases</span></li>';
    } else {
      s.recentPurchases.forEach(purchase => {
        const date = new Date(purchase.purchase_date).toLocaleDateString();
        purchasesList.innerHTML += `
          <li>
            <span class="activity-label">${purchase.supplier_name || 'Unknown'} <span class="activity-date">${date}</span></span>
            <span class="activity-amount expense">₹${parseFloat(purchase.total_amount).toLocaleString()}</span>
          </li>`;
      });
    }

    // Low stock table
    const lowStockBody = document.getElementById('low-stock-body');
    lowStockBody.innerHTML = '';
    document.getElementById('low-stock-count-badge').textContent = s.lowStockCount;

    if (s.lowStockProducts.length === 0) {
      lowStockBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">All products are well-stocked</td></tr>';
    } else {
      s.lowStockProducts.forEach(p => {
        const ratio = p.low_stock_threshold > 0 ? (p.quantity / p.low_stock_threshold) : 0;
        const statusClass = p.quantity === 0 ? 'out-of-stock' : ratio <= 0.5 ? 'low-stock' : 'low-stock';
        lowStockBody.innerHTML += `
          <tr>
            <td>${p.name}</td>
            <td>${p.quantity}</td>
            <td>${p.low_stock_threshold}</td>
            <td><span class="stock-pill ${statusClass}">${p.quantity === 0 ? 'OUT' : 'LOW'}</span></td>
          </tr>`;
      });
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to load dashboard data', 'error');
  }
}
