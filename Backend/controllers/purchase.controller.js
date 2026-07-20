const pool = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [purchases] = await pool.query(
      `SELECT p.*, s.name AS supplier_name, u.name AS created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.purchase_date DESC`
    );

    // Get items for each purchase
    for (let purchase of purchases) {
      const [items] = await pool.query(
        `SELECT pi.*, pr.name AS product_name
         FROM purchase_items pi
         LEFT JOIN products pr ON pi.product_id = pr.id
         WHERE pi.purchase_id = ?`,
        [purchase.id]
      );
      purchase.items = items;
    }

    res.json({ success: true, purchases });
  } catch (err) {
    console.error('Get purchases error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { supplier_id, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    await conn.beginTransaction();

    // Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.price;
    }

    // Insert purchase header
    const [purchaseResult] = await conn.query(
      'INSERT INTO purchases (supplier_id, total_amount, created_by) VALUES (?, ?, ?)',
      [supplier_id || null, totalAmount, req.session.user.id]
    );
    const purchaseId = purchaseResult.insertId;

    // Insert items and update stock
    for (const item of items) {
      await conn.query(
        'INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [purchaseId, item.product_id, item.quantity, item.price]
      );

      // Increment stock
      await conn.query(
        'UPDATE products SET quantity = quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      purchase_id: purchaseId,
      total_amount: totalAmount,
      message: 'Purchase created successfully. Stock updated.'
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create purchase error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    conn.release();
  }
};
