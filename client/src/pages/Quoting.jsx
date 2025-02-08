import React, { useState, useEffect } from 'react';
import { createCustomer, createPolicy, getCustomers } from '../services/api';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const QuotingPage = ({ updateDashboard }) => {
  const [quoteData, setQuoteData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    policy_type: '',
    date_of_birth: ''
  });
  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    // Fetch all customers on mount (optional, used to check existing emails quickly)
    getCustomers().catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteData((prev) => ({ ...prev, [name]: value }));
  };

  const generateQuote = () => {
    if (!quoteData.policy_type) return;

    // Generate a random premium between $1000-$1400
    const premium = (Math.random() * (1400 - 1000) + 1000).toFixed(2);
    // Random policy number
    const policyNumber = `POL-${Math.floor(Math.random() * 10000)}`;

    setGeneratedQuote({
      ...quoteData,
      proposed_premium: premium,
      policy_number: policyNumber
    });
  };

  const confirmQuote = async () => {
    try {
      // Fetch all customers to see if the email already exists
      const customers = await getCustomers();
      let existingCustomer = customers.find(
        (c) => c.email === quoteData.email
      );
      let customerId;

      if (existingCustomer) {
        // If found, reuse that ID
        customerId = existingCustomer.customer_id;
      } else {
        // Otherwise, create a new customer
        const customerResponse = await createCustomer({
          first_name: quoteData.first_name,
          last_name: quoteData.last_name,
          email: quoteData.email,
          phone: quoteData.phone,
          date_of_birth: quoteData.date_of_birth,
          address: quoteData.address,
          city: quoteData.city,
          state: quoteData.state,
          zipcode: quoteData.zipcode
        });
        customerId = customerResponse.customer_id;
      }

      // Create a policy referencing that customer
      await createPolicy({
        customer_id: customerId,
        policy_type: generatedQuote.policy_type,
        policy_number: generatedQuote.policy_number,
        effective_date: new Date().toISOString().split('T')[0],
        expiration_date: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        )
          .toISOString()
          .split('T')[0],
        premium: generatedQuote.proposed_premium
      });

      setSaveStatus({ success: true, message: 'Quote confirmed and saved!' });
      setGeneratedQuote(null);

      if (updateDashboard) {
        updateDashboard();
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: 'Could not save quote. Please try again.'
      });
      console.error('Error saving quote:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Generate Quote
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="First Name"
            name="first_name"
            fullWidth
            value={quoteData.first_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Last Name"
            name="last_name"
            fullWidth
            value={quoteData.last_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            value={quoteData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Phone"
            name="phone"
            fullWidth
            value={quoteData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Address"
            name="address"
            fullWidth
            value={quoteData.address}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="City"
            name="city"
            fullWidth
            value={quoteData.city}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="State"
            name="state"
            fullWidth
            value={quoteData.state}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Zipcode"
            name="zipcode"
            fullWidth
            value={quoteData.zipcode}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            fullWidth
            value={quoteData.date_of_birth}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            label="Policy Type"
            name="policy_type"
            fullWidth
            value={quoteData.policy_type}
            onChange={handleChange}
          >
            <MenuItem value="">Select Policy Type</MenuItem>
            <MenuItem value="auto">Auto</MenuItem>
            <MenuItem value="home">Home</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={generateQuote}>
            Generate Quote
          </Button>
        </Grid>
      </Grid>

      {generatedQuote && (
        <Card sx={{ marginTop: 3, padding: 2 }}>
          <CardContent>
            <Typography variant="h6">Quote Preview</Typography>
            <Typography>
              Name: {generatedQuote.first_name} {generatedQuote.last_name}
            </Typography>
            <Typography>Email: {generatedQuote.email}</Typography>
            <Typography>Phone: {generatedQuote.phone}</Typography>
            <Typography>
              Address: {generatedQuote.address}, {generatedQuote.city},{' '}
              {generatedQuote.state} {generatedQuote.zipcode}
            </Typography>
            <Typography>
              Date of Birth: {generatedQuote.date_of_birth}
            </Typography>
            <Typography>Policy Type: {generatedQuote.policy_type}</Typography>
            <Typography>
              Policy Number: {generatedQuote.policy_number}
            </Typography>
            <Typography>Premium: ${generatedQuote.proposed_premium}</Typography>
            <Button
              variant="contained"
              color="success"
              onClick={confirmQuote}
              sx={{ marginTop: 2 }}
            >
              Confirm &amp; Save
            </Button>
          </CardContent>
        </Card>
      )}

      {saveStatus && (
        <Alert
          severity={saveStatus.success ? 'success' : 'error'}
          sx={{ marginTop: 2 }}
        >
          {saveStatus.success ? <CheckCircleIcon /> : <ErrorIcon />}{' '}
          {saveStatus.message}
        </Alert>
      )}
    </Container>
  );
};

export default QuotingPage;
