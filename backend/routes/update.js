const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Clean and update services endpoint (one-time use)
router.post('/services', async (req, res) => {
  try {
    const client = await pool.connect();
    
    console.log('Cleaning and updating services in database...');
    
    // First, delete ALL existing services
    await client.query('TRUNCATE TABLE services CASCADE');
    console.log('All existing services deleted');
    
    // Now insert the 8 clean services
    await client.query(`
      INSERT INTO services (name, price, description) VALUES
      ('Basic Wash', 200, 'Simple exterior rinse and soap cleaning'),
      ('Express Wash', 300, 'Quick exterior wash and rinse (15 minutes)'),
      ('Interior Cleaning', 400, 'Vacuum, dashboard cleaning, and seat wiping'),
      ('Standard Wash', 500, 'Complete exterior wash with soap and wax'),
      ('Engine Bay Cleaning', 600, 'Professional engine compartment cleaning'),
      ('Full Service Wash', 700, 'Exterior wash + interior cleaning combo'),
      ('Deep Cleaning', 800, 'Thorough interior and exterior deep cleaning'),
      ('Premium Detailing', 1000, 'Complete premium cleaning with wax and protection')
    `);
    console.log('Clean 8 services inserted');
    
    const result = await client.query('SELECT * FROM services ORDER BY id');
    
    client.release();
    
    res.json({
      success: true,
      message: 'Services cleaned and updated successfully!',
      services: result.rows,
      count: result.rows.length
    });
    
  } catch (err) {
    console.error('Error updating services:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update services',
      details: err.message 
    });
  }
});

// Add missing columns to bookings table
router.post('/fix-bookings', async (req, res) => {
  try {
    const client = await pool.connect();
    
    console.log('Adding missing columns to bookings table...');
    
    // Add columns if they don't exist
    const columns = [
      { name: 'customer_name', type: 'VARCHAR(100)' },
      { name: 'customer_phone', type: 'VARCHAR(20)' },
      { name: 'customer_email', type: 'VARCHAR(100)' },
      { name: 'car_type', type: 'VARCHAR(50)' },
      { name: 'license_plate', type: 'VARCHAR(20)' },
      { name: 'car_color', type: 'VARCHAR(30)' },
      { name: 'notes', type: 'TEXT' }
    ];
    
    for (const col of columns) {
      try {
        await client.query(`
          ALTER TABLE bookings 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`Column ${col.name} added/verified`);
      } catch (err) {
        console.log(`Column ${col.name} might already exist:`, err.message);
      }
    }
    
    // Verify the table structure
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    client.release();
    
    res.json({
      success: true,
      message: 'Bookings table columns fixed!',
      columns: tableInfo.rows
    });
    
  } catch (err) {
    console.error('Error fixing bookings table:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fix bookings table',
      details: err.message 
    });
  }
});

module.exports = router;
