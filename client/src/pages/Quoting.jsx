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
  Alert,
  InputAdornment
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PolicyIcon from '@mui/icons-material/Policy';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import PinDropIcon from '@mui/icons-material/PinDrop';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import { useLocation } from 'react-router-dom';

const QuotingPage = ({ updateDashboard }) => {
  const { state } = useLocation();
  const prefill = state?.prefill;

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
    getCustomers().catch((err) => console.error(err));
    if (prefill) {
      setQuoteData((prev) => ({
        ...prev,
        first_name: prefill.first_name || '',
        last_name: prefill.last_name || '',
        email: prefill.email || '',
        phone: prefill.phone || '',
        address: prefill.address || '',
        city: prefill.city || '',
        state: prefill.state || '',
        zipcode: prefill.zipcode || '',
        date_of_birth: prefill.date_of_birth
          ? prefill.date_of_birth.split('T')[0]
          : '',
        policy_type: ''
      }));
    }
  }, [prefill]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteData((prev) => ({ ...prev, [name]: value }));
  };

  const generateQuote = () => {
    if (!quoteData.policy_type) return;

    // Set premium range based on policy type
    const premiumRange = quoteData.policy_type === 'Auto' 
      ? { min: 800, max: 1100 } 
      : { min: 1200, max: 1800 };
    
    const premium = (Math.random() * (premiumRange.max - premiumRange.min) + premiumRange.min).toFixed(2);
    
    // Create policy number based on policy type
    const prefix = quoteData.policy_type === 'Auto' ? 'AU-' : 'HO-';
    const policyNumber = `${prefix}${Math.floor(Math.random() * 10000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    
    setGeneratedQuote({
      ...quoteData,
      proposed_premium: premium,
      policy_number: policyNumber
    });
  };

  const confirmQuote = async () => {
    try {
      const customers = await getCustomers();
      let existingCustomer = customers.find((c) => c.email === quoteData.email);
      let customerId;

      if (existingCustomer) {
        customerId = existingCustomer.customer_id;
      } else {
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

      // Calculate dates for one-year policy
      const today = new Date();
      const effectiveDate = today.toISOString().split('T')[0];
      
      const expirationDate = new Date(today);
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      
      await createPolicy({
        customer_id: customerId,
        policy_type: generatedQuote.policy_type,
        policy_number: generatedQuote.policy_number,
        effective_date: effectiveDate,
        expiration_date: expirationDate.toISOString().split('T')[0],
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Last Name"
            name="last_name"
            fullWidth
            value={quoteData.last_name}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            value={quoteData.email}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Phone"
            name="phone"
            fullWidth
            value={quoteData.phone}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Address"
            name="address"
            fullWidth
            value={quoteData.address}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HomeIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="City"
            name="city"
            fullWidth
            value={quoteData.city}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationCityIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="State"
            name="state"
            fullWidth
            value={quoteData.state}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PublicIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Zipcode"
            name="zipcode"
            fullWidth
            value={quoteData.zipcode}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PinDropIcon />
                </InputAdornment>
              )
            }}
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonthIcon />
                </InputAdornment>
              )
            }}
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PolicyIcon />
                </InputAdornment>
              )
            }}
          >
            <MenuItem value="">Select Policy Type</MenuItem>
            <MenuItem value="Auto">Auto</MenuItem>
            <MenuItem value="Homeowners">Homeowners</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<MonetizationOnIcon />}
            onClick={generateQuote}
          >
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
            <Typography>Date of Birth: {generatedQuote.date_of_birth}</Typography>
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
              startIcon={<CheckCircleIcon />}
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