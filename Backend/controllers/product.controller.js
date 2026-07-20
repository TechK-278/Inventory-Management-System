const pool = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    let query = `SELECT p.*, c.name AS category_name, s.name AS supplier_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('p.category_id = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    // Count total
    const countQuery = query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;

    // Paginate
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      products: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, s.name AS supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category_id, supplier_id, purchase_price, selling_price, quantity, barcode, description, low_stock_threshold } = req.body;
    const image = req.file ? req.file.filename : null;

    const [result] = await pool.query(
      `INSERT INTO products (name, category_id, supplier_id, purchase_price, selling_price, quantity, barcode, description, image, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id || null, supplier_id || null, purchase_price || 0, selling_price || 0, quantity || 0, barcode || null, description || null, image, low_stock_threshold || 10]
    );

    res.status(201).json({ success: true, product_id: result.insertId, message: 'Product created successfully.' });
  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A product with this barcode already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, category_id, supplier_id, purchase_price, selling_price, quantity, barcode, description, low_stock_threshold } = req.body;
    const image = req.file ? req.file.filename : undefined;

    let query = `UPDATE products SET name=?, category_id=?, supplier_id=?, purchase_price=?, selling_price=?, quantity=?, barcode=?, description=?, low_stock_threshold=?`;
    const params = [name, category_id || null, supplier_id || null, purchase_price || 0, selling_price || 0, quantity || 0, barcode || null, description || null, low_stock_threshold || 10];

    if (image !== undefined) {
      query += ', image=?';
      params.push(image);
    }

    query += ' WHERE id=?';
    params.push(req.params.id);

    await pool.query(query, params);
    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    console.error('Update product error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A product with this barcode already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
