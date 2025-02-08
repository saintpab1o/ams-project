const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET a single customer by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST a new customer
router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      state,
      zipcode
    } = req.body;

    // Check if the customer already exists
    const existingCustomer = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({ error: 'Customer already exists' });
    }

    // Insert customer (including date_of_birth)
    const insertQuery = `
      INSERT INTO customers
      (first_name, last_name, email, phone, date_of_birth, address, city, state, zipcode)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      address,
      city,
      state,
      zipcode
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM customers WHERE customer_id = $1', [id]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
