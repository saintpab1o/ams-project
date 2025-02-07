const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get policies for a specific customer
router.get('/customer/:customer_id', async (req, res) => {
    try {
      const customer_id = parseInt(req.params.customer_id);
      console.log(`Fetching policies for customer_id: ${customer_id}`);
  
      const { rows } = await pool.query(
        'SELECT * FROM policies WHERE customer_id = $1',
        [customer_id]
      );
  
      console.log("Policies found:", rows);
  
      // ✅ Fix: Return empty array `[]` with status 200 instead of 404
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching customer policies:', error);
      res.status(500).json({ error: error.message });
    }
  });
ç  
  

// ✅ GET all policies
router.get('/', async (req, res) => {
  try {
    console.log("Fetching all policies");
    const { rows } = await pool.query('SELECT * FROM policies');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET a single policy by id
router.get('/:id', async (req, res) => {
  try {
    const policy_id = parseInt(req.params.id); // Convert to integer
    console.log(`Fetching policy with ID: ${policy_id}`);

    const { rows } = await pool.query(
      'SELECT * FROM policies WHERE policy_id = $1',
      [policy_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST a new policy
router.post('/', async (req, res) => {
  try {
    const { customer_id, policy_number, policy_type, effective_date, expiration_date, premium } = req.body;
    console.log("Creating new policy:", req.body);

    const { rows } = await pool.query(
      `INSERT INTO policies (customer_id, policy_number, policy_type, effective_date, expiration_date, premium)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customer_id, policy_number, policy_type, effective_date, expiration_date, premium]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT update a policy
router.put('/:id', async (req, res) => {
  try {
    const policy_id = parseInt(req.params.id);
    const { customer_id, policy_number, policy_type, effective_date, expiration_date, premium } = req.body;
    console.log(`Updating policy ${policy_id}:`, req.body);

    const { rows } = await pool.query(
      `UPDATE policies
       SET customer_id = $1, policy_number = $2, policy_type = $3, effective_date = $4, expiration_date = $5, premium = $6
       WHERE policy_id = $7 RETURNING *`,
      [customer_id, policy_number, policy_type, effective_date, expiration_date, premium, policy_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ DELETE a policy
router.delete('/:id', async (req, res) => {
  try {
    const policy_id = parseInt(req.params.id);
    console.log(`Deleting policy with ID: ${policy_id}`);

    const result = await pool.query('DELETE FROM policies WHERE policy_id = $1 RETURNING *', [policy_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
