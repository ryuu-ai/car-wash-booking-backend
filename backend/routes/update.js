const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Update services endpoint (one-time use)
router.post('/services', async (req, res) => {
  try {
    const client = await pool.connect();
    
    console.log('Updating services in database...');
    
    // Delete all existing services
    await client.query('DELETE FROM services');
    console.log('Old services deleted');
    
    // Insert the new 8 universal services
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
    
    // Get updated services
    const result = await client.query('SELECT * FROM services ORDER BY id');
    
    client.release();
    
    res.json({
      success: true,
      message: 'Services updated successfully!',
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