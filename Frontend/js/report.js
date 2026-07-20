/* ============================================================
   REPORTS — Charts (Canvas) + monospace data table + date filters
   Bar/line charts in primary/accent colors only (no rainbow)
   ============================================================ */

var API_BASE = '/api';
let currentReport = 'sales';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await initPage();
  if (!user) return;
  setupEventListeners();
  loadReport('sales');
});

function setupEventListeners() {
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentReport = tab.dataset.report;
      loadReport(currentReport);
    });
  });

  document.getElementById('btn-apply-filter').addEventListener('click', () => {
    loadReport(currentReport);
  });
}

async function loadReport(type) {
  const from = document.getElementById('filter-from').value;
  const to = document.getElementById('filter-to').value;

  let url = `${API_BASE}/reports/${type}`;
  const params = [];
  if (from) params.push(`from=${from}`);
  if (to) params.push(`to=${to}`);
  if (params.length) url += '?' + params.join('&');

  // Hide/show date filters for stock report (no date range)
  document.getElementById('date-filters').style.display = type === 'stock' ? 'none' : 'flex';

  try {
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (!data.success) return showToast('Failed to load report', 'error');

    renderReportTable(type, data);
    renderChart(type, data);
  } catch (err) {
    showToast('Failed to load report', 'error');
  }
}

function renderReportTable(type, data) {
  const thead = document.getElementById('report-thead');
  const tbody = document.getElementById('report-tbody');
  const totalRow = document.getElementById('report-total');

  switch (type) {
    case 'sales':
      thead.innerHTML = '<tr><th>ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Amount</th></tr>';
      tbody.innerHTML = data.report.map(r => `
        <tr>
          <td>#${r.id}</td>
          <td>${new Date(r.sale_date).toLocaleDateString()}</td>
          <td>${r.customer_name || 'Walk-in'}</td>
          <td>${r.items_summary || '—'}</td>
          <td>₹${parseFloat(r.total_amount).toFixed(2)}</td>
        </tr>`).join('');
      totalRow.innerHTML = `<td colspan="4" style="text-align:right;font-weight:700;">Total Sales</td><td style="font-weight:700;">₹${data.total.toFixed(2)}</td>`;
      break;

    case 'purchases':
      thead.innerHTML = '<tr><th>ID</th><th>Date</th><th>Supplier</th><th>Items</th><th>Amount</th></tr>';
      tbody.innerHTML = data.report.map(r => `
        <tr>
          <td>#${r.id}</td>
          <td>${new Date(r.purchase_date).toLocaleDateString()}</td>
          <td>${r.supplier_name || 'Unknown'}</td>
          <td>${r.items_summary || '—'}</td>
          <td>₹${parseFloat(r.total_amount).toFixed(2)}</td>
        </tr>`).join('');
      totalRow.innerHTML = `<td colspan="4" style="text-align:right;font-weight:700;">Total Purchases</td><td style="font-weight:700;">₹${data.total.toFixed(2)}</td>`;
      break;

    case 'stock':
      thead.innerHTML = '<tr><th>Product</th><th>Category</th><th>Qty</th><th>Threshold</th><th>Buy Price</th><th>Sell Price</th><th>Status</th></tr>';
      tbody.innerHTML = data.report.map(r => {
        const cls = r.stock_status === 'low' ? 'low-stock' : 'in-stock';
        return `
          <tr>
            <td>${r.name}</td>
            <td>${r.category_name || '—'}</td>
            <td>${r.quantity}</td>
            <td>${r.low_stock_threshold}</td>
            <td>₹${parseFloat(r.purchase_price).toFixed(2)}</td>
            <td>₹${parseFloat(r.selling_price).toFixed(2)}</td>
            <td><span class="stock-pill ${cls}">${r.stock_status === 'low' ? 'LOW' : 'OK'}</span></td>
          </tr>`;
      }).join('');
      totalRow.innerHTML = `<td colspan="7" style="text-align:right;">Total products: ${data.report.length}</td>`;
      break;

    case 'profit':
      thead.innerHTML = '<tr><th>Product</th><th>Qty Sold</th><th>Profit</th></tr>';
      tbody.innerHTML = data.report.map(r => `
        <tr>
          <td>${r.product_name}</td>
          <td>${r.total_sold}</td>
          <td style="color:${parseFloat(r.profit) >= 0 ? 'var(--success)' : 'var(--danger)'};">₹${parseFloat(r.profit || 0).toFixed(2)}</td>
        </tr>`).join('');
      totalRow.innerHTML = `<td colspan="2" style="text-align:right;font-weight:700;">Total Profit</td><td style="font-weight:700;color:var(--success);">₹${data.totalProfit.toFixed(2)}</td>`;
      break;
  }

  if (data.report.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;">No data for this period</td></tr>`;
    totalRow.innerHTML = '';
  }
}

function renderChart(type, data) {
  const canvas = document.getElementById('report-chart');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = 240;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (data.report.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px "Public Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data to chart', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Colors from design tokens
  const primaryColor = '#35566B';
  const accentColor = '#C8862B';
  const lineColor = '#C9BFAE';

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  let labels = [];
  let values = [];

  switch (type) {
    case 'sales':
      labels = data.report.slice(0, 20).map(r => new Date(r.sale_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      values = data.report.slice(0, 20).map(r => parseFloat(r.total_amount));
      break;
    case 'purchases':
      labels = data.report.slice(0, 20).map(r => new Date(r.purchase_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }));
      values = data.report.slice(0, 20).map(r => parseFloat(r.total_amount));
      break;
    case 'stock':
      labels = data.report.slice(0, 20).map(r => r.name.substring(0, 10));
      values = data.report.slice(0, 20).map(r => r.quantity);
      break;
    case 'profit':
      labels = data.report.slice(0, 20).map(r => r.product_name.substring(0, 10));
      values = data.report.slice(0, 20).map(r => parseFloat(r.profit || 0));
      break;
  }

  if (values.length === 0) return;

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const barWidth = Math.min(40, (chartW / values.length) * 0.6);
  const gap = chartW / values.length;

  // Y-axis gridlines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = '#888';
  ctx.font = '11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (i / 4) * chartH;
    const val = minVal + (i / 4) * range;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.stroke();
    ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0), padding.left - 8, y + 4);
  }

  // Bars
  values.forEach((val, i) => {
    const x = padding.left + gap * i + (gap - barWidth) / 2;
    const barH = ((val - minVal) / range) * chartH;
    const y = padding.top + chartH - barH;

    // Color: primary for positive, accent for special
    ctx.fillStyle = type === 'profit' && val < 0 ? '#9A3324' : primaryColor;
    ctx.fillRect(x, y, barWidth, barH);

    // Hover-like top accent line
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, barWidth, 2);

    // X-axis label
    ctx.fillStyle = '#888';
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + barWidth / 2, padding.top + chartH + 14);
    ctx.rotate(-0.4);
    ctx.fillText(labels[i], 0, 0);
    ctx.restore();
  });
}

// Resize chart on window resize
window.addEventListener('resize', () => {
  if (currentReport) loadReport(currentReport);
});
