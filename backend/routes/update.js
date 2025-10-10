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

module.exports = router;
