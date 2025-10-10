const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Update services endpoint (one-time use)
router.post('/services', async (req, res) => {
  try {
    const client = await pool.connect();
    
    console.log('Updating services in database...');
    
    // Update existing services (IDs 1, 2, 3) instead of deleting
    await client.query(`
      UPDATE services SET name = 'Basic Wash', price = 200, description = 'Simple exterior rinse and soap cleaning' WHERE id = 1
    `);
    await client.query(`
      UPDATE services SET name = 'Express Wash', price = 300, description = 'Quick exterior wash and rinse (15 minutes)' WHERE id = 2
    `);
    await client.query(`
      UPDATE services SET name = 'Interior Cleaning', price = 400, description = 'Vacuum, dashboard cleaning, and seat wiping' WHERE id = 3
    `);
    console.log('Existing services updated');
    
    // Insert the new 5 services
    await client.query(`
      INSERT INTO services (name, price, description) VALUES
      ('Standard Wash', 500, 'Complete exterior wash with soap and wax'),
      ('Engine Bay Cleaning', 600, 'Professional engine compartment cleaning'),
      ('Full Service Wash', 700, 'Exterior wash + interior cleaning combo'),
      ('Deep Cleaning', 800, 'Thorough interior and exterior deep cleaning'),
      ('Premium Detailing', 1000, 'Complete premium cleaning with wax and protection')
    `);
    console.log('New services inserted');
    
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
