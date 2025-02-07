import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomers, getPoliciesByCustomer } from '../services/api';
import { Card, CardContent, Typography, Grid } from '@mui/material';

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const customers = await getCustomers();
        const foundCustomer = customers.find(c => c.customer_id === parseInt(customerId));
        setCustomer(foundCustomer);

        const policyData = await getPoliciesByCustomer(customerId);
        setPolicies(policyData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };
    fetchCustomerData();
  }, [customerId]);

  if (!customer) return <Typography>Loading customer data...</Typography>;

  const formatDate = (dateString) => new Date(dateString).toISOString().split('T')[0];

  const calculateDaysUntilRenewal = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const timeDiff = expDate - today;
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert to days
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Customer Details</Typography>

      <Card style={{ marginBottom: '20px' }}>
        <CardContent>
          <Typography variant="h6">{customer.first_name} {customer.last_name}</Typography>
          <Typography>{customer.email}</Typography>
          <Typography>{customer.phone}</Typography>
          <Typography>📍 {customer.address}, {customer.city}, {customer.state} {customer.zipcode}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>Policies</Typography>
      <Grid container spacing={2}>
        {policies.map((policy) => (
          <Grid item xs={12} sm={6} key={policy.policy_id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  {policy.policy_type.toUpperCase()} - {policy.policy_number}
                </Typography>
                <Typography>💲 Premium: <strong>${policy.premium}</strong></Typography>
               <Typography><strong>Expiration:</strong> {formatDate(policy.expiration_date)}</Typography>
               <Typography variant="subtitle2" style={{ color: 'red', fontWeight: 'bold' }}>
                  🕒 Days Until Renewal: {calculateDaysUntilRenewal(policy.expiration_date)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default CustomerDetailPage;
