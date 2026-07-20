const bcrypt = require('bcryptjs');

async function seed() {
  const pool = require('./models/db');

  try {
    // Check if admin already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@ims.com']);
    if (existing.length > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    // Create admin with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin@ims.com', hashedPassword, 'admin']
    );

    console.log('Admin user created successfully!');
    console.log('Email: admin@ims.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
