const pool = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(s.id) AS sales_count
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ success: true, customers: rows });
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    res.json({ success: true, customer: rows[0] });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone || null, email || null, address || null]
    );
    res.status(201).json({ success: true, customer_id: result.insertId, message: 'Customer created successfully.' });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required.' });
    }
    await pool.query(
      'UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?',
      [name, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ success: true, message: 'Customer updated successfully.' });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
