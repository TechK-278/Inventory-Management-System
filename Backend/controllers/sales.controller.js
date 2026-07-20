const pool = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [sales] = await pool.query(
      `SELECT s.*, c.name AS customer_name, u.name AS created_by_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.created_by = u.id
       ORDER BY s.sale_date DESC`
    );

    // Get items for each sale
    for (let sale of sales) {
      const [items] = await pool.query(
        `SELECT si.*, p.name AS product_name
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [sale.id]
      );
      sale.items = items;
    }

    res.json({ success: true, sales });
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { customer_id, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    await conn.beginTransaction();

    // Validate stock availability for all items first
    for (const item of items) {
      const [rows] = await conn.query('SELECT quantity, name FROM products WHERE id = ?', [item.product_id]);
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Product with ID ${item.product_id} not found.` });
      }
      if (rows[0].quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${rows[0].name}". Available: ${rows[0].quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.price;
    }

    // Insert sale header
    const [saleResult] = await conn.query(
      'INSERT INTO sales (customer_id, total_amount, created_by) VALUES (?, ?, ?)',
      [customer_id || null, totalAmount, req.session.user.id]
    );
    const saleId = saleResult.insertId;

    // Insert items and update stock
    for (const item of items) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.price]
      );

      // Decrement stock
      await conn.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      sale_id: saleId,
      total_amount: totalAmount,
      message: 'Sale created successfully. Stock updated.'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create sale error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
};
