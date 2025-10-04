const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      service_id, 
      booking_date, 
      booking_time, 
      customer_name, 
      customer_phone, 
      customer_email, 
      car_type, 
      license_plate, 
      car_color, 
      notes 
    } = req.body;
    const user_id = req.user.userId;

    // Validate required fields
    if (!service_id || !booking_date || !booking_time || !customer_name || !customer_phone || !customer_email || !car_type || !license_plate) {
      return res.status(400).json({ error: 'Service ID, date, time, customer info, and vehicle details are required' });
    }

    // Check if service exists
    const serviceCheck = await pool.query('SELECT * FROM services WHERE id = $1', [service_id]);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Create booking with all details
    const result = await pool.query(
      `INSERT INTO bookings (
        user_id, service_id, booking_date, booking_time, 
        customer_name, customer_phone, customer_email, 
        car_type, license_plate, car_color, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        user_id, service_id, booking_date, booking_time,
        customer_name, customer_phone, customer_email,
        car_type, license_plate, car_color, notes, 'pending'
      ]
    );

    // Get booking with service details
    const bookingWithDetails = await pool.query(`
      SELECT b.*, s.name as service_name, s.price as service_price, s.description as service_description
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingWithDetails.rows[0]
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const result = await pool.query(`
      SELECT b.*, s.name as service_name, s.price as service_price, s.description as service_description
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [user_id]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.userId;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if booking exists and belongs to user
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking status
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, user_id]
    );

    res.json({
      message: 'Booking updated successfully',
      booking: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
