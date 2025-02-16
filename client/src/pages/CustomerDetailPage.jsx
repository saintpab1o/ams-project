import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomers, getPoliciesByCustomer } from '../services/api';

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Divider,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab
} from '@mui/material';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

function calculateDaysUntilRenewal(expirationDate) {
  if (!expirationDate) return 0;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const timeDiff = expDate - today;
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
}

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [policies, setPolicies] = useState([]);

  // For tab switching
  const [tabValue, setTabValue] = useState(0);

  // Example placeholders for advanced data:
  const [leadStage, setLeadStage] = useState('New Lead'); // "New Lead", "Qualified", "Opportunity", "Closed Won", ...
  const [notes, setNotes] = useState('');
  const [lifeEvents, setLifeEvents] = useState([]); // e.g., {title: 'Son turns 16', date: '2024-05-10'}

  // For "marketing campaigns" placeholders
  const [campaigns, setCampaigns] = useState([
    { name: 'Renewal 30-Day Reminder', active: true },
    { name: 'Birthday Email', active: false }
  ]);

  // Load data on mount
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const customers = await getCustomers();
        const foundCustomer = customers.find(
          (c) => c.customer_id === parseInt(customerId, 10)
        );
        setCustomer(foundCustomer);

        const policyData = await getPoliciesByCustomer(customerId);
        setPolicies(policyData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };
    fetchCustomerData();
  }, [customerId]);

  if (!customer) {
    return <Typography>Loading customer data...</Typography>;
  }

  // Handle tab changes
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // Example function: add a new life event
  const handleAddLifeEvent = () => {
    const example = {
      title: 'Son turning 16',
      date: '2025-07-01'
    };
    setLifeEvents((prev) => [...prev, example]);
  };

  // Example function: save notes
  const handleSaveNotes = () => {
    console.log('Saving notes: ', notes);
    // In real usage, you'd post to your API
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Customer Details & Management</Typography>

      {/* Basic Customer Info */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {customer.first_name} {customer.last_name}
          </Typography>
          <Typography>Email: {customer.email}</Typography>
          <Typography>Phone: {customer.phone}</Typography>
          <Typography>
            Address: {customer.address}, {customer.city}, {customer.state} {customer.zipcode}
          </Typography>
        </CardContent>
      </Card>

      {/* TABS for advanced features */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleChangeTab} indicatorColor="primary">
          <Tab label="Policies" />
          <Tab label="Lead / Opportunity" />
          <Tab label="Life Events" />
          <Tab label="Notes" />
          <Tab label="Campaigns" />
        </Tabs>
      </Paper>

      {/* TAB PANELS */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Policies
          </Typography>
          <Grid container spacing={2}>
            {policies.map((policy) => (
              <Grid item xs={12} sm={6} md={4} key={policy.policy_id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {policy.policy_type.toUpperCase()} - {policy.policy_number}
                    </Typography>
                    <Typography>
                      💲 Premium: <strong>${policy.premium}</strong>
                    </Typography>
                    <Typography>
                      <strong>Expiration:</strong> {formatDate(policy.expiration_date)}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'red', fontWeight: 'bold' }}>
                      🕒 Days Until Renewal: {calculateDaysUntilRenewal(policy.expiration_date)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Lead & Opportunity Tracking
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Example: just show a simple dropdown or text for lead stage */}
          <Typography variant="body1" sx={{ mb: 1 }}>
            Current Stage: <strong>{leadStage}</strong>
          </Typography>
          <Button
            variant="contained"
            onClick={() => setLeadStage('Opportunity')}
            sx={{ mr: 2 }}
          >
            Move to Opportunity
          </Button>
          <Button
            variant="contained"
            onClick={() => setLeadStage('Closed Won')}
            color="success"
          >
            Mark as Closed Won
          </Button>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Life Events
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {lifeEvents.map((evt, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {evt.title}
              </Typography>
              <Typography>Date: {evt.date}</Typography>
            </Box>
          ))}

          <Button variant="contained" onClick={handleAddLifeEvent}>
            Add Example Life Event
          </Button>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Notes / Interactions
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" gutterBottom>
            Record your calls or important details here.
          </Typography>
          <TextField
            multiline
            minRows={4}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type your notes here..."
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </Box>
      )}

      {tabValue === 4 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Marketing Campaigns
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {campaigns.map((c, idx) => (
            <Box key={idx} display="flex" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ mr: 2, fontWeight: 'bold' }}>
                {c.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {c.active ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
          ))}
          <Typography variant="body2" sx={{ mt: 2 }}>
            (Placeholders) In a real system, you might toggle these on/off or create new campaigns
            for birthdays, renewals, or cross-sell triggers.
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default CustomerDetailPage;
