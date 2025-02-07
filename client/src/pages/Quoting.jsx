import React, { useState } from 'react';
import { createCustomer, createPolicy } from '../services/api';
import { Container, Typography, TextField, MenuItem, Button, Paper, Grid } from '@mui/material';

const QuotingPage = () => {
  const [customer, setCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: ''
  });
  const [policyType, setPolicyType] = useState('Auto');
  const [proposedPremium, setProposedPremium] = useState(null);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const generateQuote = () => {
    const basePremium = policyType === 'Auto' ? 1200 : 1400;
    const discount = Math.random() * 200;
    setProposedPremium((basePremium - discount).toFixed(2));
    setQuoteGenerated(true);
  };

  const handleAddPolicy = async () => {
    try {
      const newCustomer = await createCustomer(customer);
      await createPolicy({
        customer_id: newCustomer.customer_id,
        policy_number: `POL-${Math.floor(Math.random() * 1000)}`,
        policy_type: policyType,
        effective_date: new Date().toISOString().split('T')[0],
        expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        premium: proposedPremium
      });
      alert('Policy successfully added!');
      setCustomer({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zipcode: '' });
      setPolicyType('Auto');
      setProposedPremium(null);
      setQuoteGenerated(false);
    } catch (error) {
      console.error('Error adding policy:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Insurance Quoting</Typography>
      <Paper sx={{ padding: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="First Name" name="first_name" value={customer.first_name} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Last Name" name="last_name" value={customer.last_name} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Email" name="email" value={customer.email} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Phone" name="phone" value={customer.phone} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Address" name="address" value={customer.address} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="City" name="city" value={customer.city} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="State" name="state" value={customer.state} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Zipcode" name="zipcode" value={customer.zipcode} onChange={handleInputChange} /></Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Policy Type" value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
              <MenuItem value="Auto">Auto</MenuItem>
              <MenuItem value="Home">Home</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={generateQuote}>Generate Quote</Button>
          </Grid>
        </Grid>
        {quoteGenerated && (
          <Paper sx={{ marginTop: 3, padding: 2, backgroundColor: '#2D2F36', color: '#FFFFFF', textAlign: 'center' }}>
            <Typography variant="h6">Proposed Premium:</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFD700' }}>${proposedPremium}</Typography>
            <Button fullWidth variant="contained" color="primary" onClick={handleAddPolicy} sx={{ marginTop: 2 }}>Add Policy</Button>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default QuotingPage;
