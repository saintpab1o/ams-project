const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const pool = require('./db');

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Import CRUD routes
const customersRouter = require('./routes/customers');
const policiesRouter = require('./routes/policies');

// Use the CRUD routes
app.use('/api/customers', customersRouter);
app.use('/api/policies', policiesRouter);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
