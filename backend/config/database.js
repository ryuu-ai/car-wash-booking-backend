const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialization script
const initDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT
      )
    `);

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        service_id INTEGER REFERENCES services(id),
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default services if they don't exist
    const servicesCheck = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(servicesCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO services (name, price, description) VALUES
        ('Exterior Wash', 500, 'Complete exterior car wash and wax'),
        ('Interior Wash', 500, 'Deep interior cleaning and vacuum'),
        ('Full Wash', 1000, 'Complete exterior and interior car wash')
      `);
      console.log('Default services inserted');
    }

    client.release();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

module.exports = { pool, initDatabase };
