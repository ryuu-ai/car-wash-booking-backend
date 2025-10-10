const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const updateServices = async () => {
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
    console.log('New services inserted successfully!');
    
    // Verify the update
    const result = await client.query('SELECT * FROM services ORDER BY id');
    console.log('\nUpdated services:');
    result.rows.forEach(service => {
      console.log(`- ${service.name}: ₱${service.price} - ${service.description}`);
    });
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('Error updating services:', err);
    process.exit(1);
  }
};

updateServices();
