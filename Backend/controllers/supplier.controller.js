const pool = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, COUNT(p.id) AS product_count
       FROM suppliers s
       LEFT JOIN products p ON s.id = p.supplier_id
       GROUP BY s.id
       ORDER BY s.name ASC`
    );
    res.json({ success: true, suppliers: rows });
  } catch (err) {
    console.error('Get suppliers error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supplier not found.' });
    }
    res.json({ success: true, supplier: rows[0] });
  } catch (err) {
    console.error('Get supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, company, phone, email, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO suppliers (name, company, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name, company || null, phone || null, email || null, address || null]
    );
    res.status(201).json({ success: true, supplier_id: result.insertId, message: 'Supplier created successfully.' });
  } catch (err) {
    console.error('Create supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, company, phone, email, address } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }
    await pool.query(
      'UPDATE suppliers SET name=?, company=?, phone=?, email=?, address=? WHERE id=?',
      [name, company || null, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ success: true, message: 'Supplier updated successfully.' });
  } catch (err) {
    console.error('Update supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Supplier deleted successfully.' });
  } catch (err) {
    console.error('Delete supplier error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
