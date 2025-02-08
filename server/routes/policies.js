// routes/policies.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all policies
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM policies');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET policies for a specific customer
router.get('/customer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM policies WHERE customer_id = $1',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching policies for customer ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// POST a new policy
router.post('/', async (req, res) => {
  try {
    const {
      customer_id,
      policy_number,
      policy_type,
      effective_date,
      expiration_date,
      premium
    } = req.body;

    // Optional: check if policy_number is already in use
    const existingPolicy = await pool.query(
      'SELECT * FROM policies WHERE policy_number = $1',
      [policy_number]
    );
    if (existingPolicy.rows.length > 0) {
      return res.status(400).json({ error: 'Policy already exists' });
    }

    // Insert new policy
    const { rows } = await pool.query(
      `INSERT INTO policies
       (customer_id, policy_number, policy_type, effective_date, expiration_date, premium)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customer_id, policy_number, policy_type, effective_date, expiration_date, premium]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
