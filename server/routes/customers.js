// routes/customers.js
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

// GET a single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [id]);
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
    const { first_name, last_name, email, phone, address, city, state, zipcode, date_of_birth } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zipcode, date_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [first_name, last_name, email, phone, address, city, state, zipcode, date_of_birth]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update a customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, address, city, state, zipcode, date_of_birth } = req.body;

    const { rows } = await pool.query(
      `UPDATE customers
       SET first_name = $1, last_name = $2, email = $3, phone = $4, address = $5, city = $6, state = $7, zipcode = $8, date_of_birth = $9
       WHERE customer_id = $10 RETURNING *`,
      [first_name, last_name, email, phone, address, city, state, zipcode, date_of_birth, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
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
