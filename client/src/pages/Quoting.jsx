import React, { useState } from 'react';
import { createCustomer, createPolicy, getCustomers, getPolicies } from '../services/api';
import { Container, Typography, TextField, Button, MenuItem, Card, CardContent, Grid, Alert } from '@mui/material';
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
  });
  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteData((prev) => ({ ...prev, [name]: value }));
  };

  const generateQuote = () => {
    if (!quoteData.policy_type) return;

    const premium = (Math.random() * (1400 - 1000) + 1000).toFixed(2);
    const policyNumber = `POL-${Math.floor(Math.random() * 10000)}`;

    setGeneratedQuote({ ...quoteData, proposed_premium: premium, policy_number: policyNumber });
  };

  const confirmQuote = async () => {
    try {
      const customerResponse = await createCustomer({
        first_name: generatedQuote.first_name,
        last_name: generatedQuote.last_name,
        email: generatedQuote.email,
        phone: generatedQuote.phone,
        address: generatedQuote.address,
        city: generatedQuote.city,
        state: generatedQuote.state,
        zipcode: generatedQuote.zipcode,
      });
      
      const newCustomerId = customerResponse.customer_id;
      
      await createPolicy({
        customer_id: newCustomerId,
        policy_type: generatedQuote.policy_type,
        policy_number: generatedQuote.policy_number,
        effective_date: new Date().toISOString().split('T')[0],
        expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        premium: generatedQuote.proposed_premium,
      });

      setSaveStatus({ success: true, message: 'Quote confirmed and saved!' });
      setGeneratedQuote(null);
      updateDashboard();
    } catch (error) {
      setSaveStatus({ success: false, message: 'Could not save quote. Please try again.' });
      console.error('Error saving quote:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Generate Quote</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="First Name" name="first_name" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Last Name" name="last_name" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Email" name="email" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Phone" name="phone" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Address" name="address" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="City" name="city" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={3}>
          <TextField label="State" name="state" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={3}>
          <TextField label="Zipcode" name="zipcode" fullWidth onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <TextField select label="Policy Type" name="policy_type" fullWidth onChange={handleChange}>
            <MenuItem value="auto">Auto</MenuItem>
            <MenuItem value="home">Home</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" onClick={generateQuote}>Generate Quote</Button>
        </Grid>
      </Grid>
      
      {generatedQuote && (
        <Card sx={{ marginTop: 3, padding: 2 }}>
          <CardContent>
            <Typography variant="h6">Quote Preview</Typography>
            <Typography>Name: {generatedQuote.first_name} {generatedQuote.last_name}</Typography>
            <Typography>Email: {generatedQuote.email}</Typography>
            <Typography>Phone: {generatedQuote.phone}</Typography>
            <Typography>Address: {generatedQuote.address}, {generatedQuote.city}, {generatedQuote.state} {generatedQuote.zipcode}</Typography>
            <Typography>Policy Type: {generatedQuote.policy_type}</Typography>
            <Typography>Policy Number: {generatedQuote.policy_number}</Typography>
            <Typography>Premium: ${generatedQuote.proposed_premium}</Typography>
            <Button variant="contained" color="success" onClick={confirmQuote}>Confirm & Save</Button>
          </CardContent>
        </Card>
      )}
      
      {saveStatus && (
        <Alert severity={saveStatus.success ? "success" : "error"} sx={{ marginTop: 2 }}>
          {saveStatus.success ? <CheckCircleIcon /> : <ErrorIcon />} {saveStatus.message}
        </Alert>
      )}
    </Container>
  );
};

export default QuotingPage;
