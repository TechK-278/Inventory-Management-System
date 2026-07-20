const pool = require('../models/db');

exports.dashboardSummary = async (req, res) => {
  try {
    // Total counts
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');
    const [[{ totalCategories }]] = await pool.query('SELECT COUNT(*) AS totalCategories FROM categories');
    const [[{ totalSuppliers }]] = await pool.query('SELECT COUNT(*) AS totalSuppliers FROM suppliers');
    const [[{ totalCustomers }]] = await pool.query('SELECT COUNT(*) AS totalCustomers FROM customers');

    // Today's sales
    const [[{ todaySales }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS todaySales FROM sales WHERE DATE(sale_date) = CURDATE()`
    );
    const [[{ todaySalesCount }]] = await pool.query(
      `SELECT COUNT(*) AS todaySalesCount FROM sales WHERE DATE(sale_date) = CURDATE()`
    );

    // Today's purchases
    const [[{ todayPurchases }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS todayPurchases FROM purchases WHERE DATE(purchase_date) = CURDATE()`
    );
    const [[{ todayPurchasesCount }]] = await pool.query(
      `SELECT COUNT(*) AS todayPurchasesCount FROM purchases WHERE DATE(purchase_date) = CURDATE()`
    );

    // Low stock products
    const [lowStockProducts] = await pool.query(
      `SELECT id, name, quantity, low_stock_threshold FROM products WHERE quantity <= low_stock_threshold ORDER BY quantity ASC`
    );

    // Total revenue (all time)
    const [[{ totalRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM sales`
    );

    // Recent sales
    const [recentSales] = await pool.query(
      `SELECT s.id, s.total_amount, s.sale_date, c.name AS customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ORDER BY s.sale_date DESC LIMIT 5`
    );

    // Recent purchases
    const [recentPurchases] = await pool.query(
      `SELECT p.id, p.total_amount, p.purchase_date, s.name AS supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       ORDER BY p.purchase_date DESC LIMIT 5`
    );

    res.json({
      success: true,
      summary: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalCustomers,
        todaySales: parseFloat(todaySales),
        todaySalesCount,
        todayPurchases: parseFloat(todayPurchases),
        todayPurchasesCount,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        totalRevenue: parseFloat(totalRevenue),
        recentSales,
        recentPurchases
      }
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.salesReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT s.id, s.sale_date, s.total_amount, c.name AS customer_name,
                 GROUP_CONCAT(CONCAT(p.name, ' x', si.quantity) SEPARATOR ', ') AS items_summary
                 FROM sales s
                 LEFT JOIN customers c ON s.customer_id = c.id
                 LEFT JOIN sale_items si ON s.id = si.sale_id
                 LEFT JOIN products p ON si.product_id = p.id`;
    const params = [];

    if (from && to) {
      query += ' WHERE DATE(s.sale_date) BETWEEN ? AND ?';
      params.push(from, to);
    } else if (from) {
      query += ' WHERE DATE(s.sale_date) >= ?';
      params.push(from);
    } else if (to) {
      query += ' WHERE DATE(s.sale_date) <= ?';
      params.push(to);
    }

    query += ' GROUP BY s.id ORDER BY s.sale_date DESC';

    const [rows] = await pool.query(query, params);

    // Total
    let total = 0;
    rows.forEach(r => total += parseFloat(r.total_amount));

    res.json({ success: true, report: rows, total });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.purchaseReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT p.id, p.purchase_date, p.total_amount, s.name AS supplier_name,
                 GROUP_CONCAT(CONCAT(pr.name, ' x', pi.quantity) SEPARATOR ', ') AS items_summary
                 FROM purchases p
                 LEFT JOIN suppliers s ON p.supplier_id = s.id
                 LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
                 LEFT JOIN products pr ON pi.product_id = pr.id`;
    const params = [];

    if (from && to) {
      query += ' WHERE DATE(p.purchase_date) BETWEEN ? AND ?';
      params.push(from, to);
    } else if (from) {
      query += ' WHERE DATE(p.purchase_date) >= ?';
      params.push(from);
    } else if (to) {
      query += ' WHERE DATE(p.purchase_date) <= ?';
      params.push(to);
    }

    query += ' GROUP BY p.id ORDER BY p.purchase_date DESC';

    const [rows] = await pool.query(query, params);

    let total = 0;
    rows.forEach(r => total += parseFloat(r.total_amount));

    res.json({ success: true, report: rows, total });
  } catch (err) {
    console.error('Purchase report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.stockReport = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.quantity, p.low_stock_threshold, p.purchase_price, p.selling_price,
              c.name AS category_name, s.name AS supplier_name,
              CASE WHEN p.quantity <= p.low_stock_threshold THEN 'low' ELSE 'ok' END AS stock_status
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       ORDER BY p.quantity ASC`
    );
    res.json({ success: true, report: rows });
  } catch (err) {
    console.error('Stock report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.profitReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = `SELECT p.name AS product_name,
                 SUM(si.quantity) AS total_sold,
                 SUM((si.price - p.purchase_price) * si.quantity) AS profit
                 FROM sale_items si
                 JOIN products p ON si.product_id = p.id
                 JOIN sales s ON si.sale_id = s.id`;
    const params = [];

    if (from && to) {
      query += ' WHERE DATE(s.sale_date) BETWEEN ? AND ?';
      params.push(from, to);
    } else if (from) {
      query += ' WHERE DATE(s.sale_date) >= ?';
      params.push(from);
    } else if (to) {
      query += ' WHERE DATE(s.sale_date) <= ?';
      params.push(to);
    }

    query += ' GROUP BY p.id, p.name ORDER BY profit DESC';

    const [rows] = await pool.query(query, params);

    let totalProfit = 0;
    rows.forEach(r => totalProfit += parseFloat(r.profit || 0));

    res.json({ success: true, report: rows, totalProfit });
  } catch (err) {
    console.error('Profit report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
