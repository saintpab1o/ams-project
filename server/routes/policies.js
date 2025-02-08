const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST a new policy
router.post('/', async (req, res) => {
  try {
    const { customer_id, policy_number, policy_type, effective_date, expiration_date, premium } = req.body;

    // Check if policy already exists
    const existingPolicy = await pool.query(
      'SELECT * FROM policies WHERE policy_number = $1',
      [policy_number]
    );

    if (existingPolicy.rows.length > 0) {
      return res.status(400).json({ error: 'Policy already exists' });
    }

    const { rows } = await pool.query(
      `INSERT INTO policies (customer_id, policy_number, policy_type, effective_date, expiration_date, premium)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customer_id, policy_number, policy_type, effective_date, expiration_date, premium]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
