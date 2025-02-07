import React, { useState, useEffect } from 'react';
import { getCustomers, getPoliciesByCustomer } from '../services/api';
import { Card, CardContent, Typography, Grid, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [customerPolicies, setCustomerPolicies] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleTogglePolicies = async (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
    } else {
      try {
        const policies = await getPoliciesByCustomer(customerId);
        setCustomerPolicies((prev) => ({ ...prev, [customerId]: policies }));
        setExpandedCustomer(customerId);
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    }
  };

  const formatDate = (dateString) => new Date(dateString).toISOString().split('T')[0];

  const calculateDaysUntilRenewal = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const timeDiff = expDate - today;
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert milliseconds to days
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>Customers</Typography>

      <Grid container spacing={2}>
        {customers.map((customer) => {
          const policies = customerPolicies[customer.customer_id] || [];
          const totalPremium = policies.reduce((sum, policy) => sum + Number(policy.premium || 0), 0);

          return (
            <Grid item xs={12} sm={6} md={4} key={customer.customer_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {customer.first_name} {customer.last_name}
                  </Typography>
                  <Typography color="textSecondary">{customer.email}</Typography>
                  <Typography color="textSecondary">{customer.phone}</Typography>
                  <Typography color="textPrimary">
                    📍 {customer.address}, {customer.city}, {customer.state} {customer.zipcode}
                  </Typography>
                  <IconButton onClick={() => handleTogglePolicies(customer.customer_id)}>
                    <ExpandMoreIcon />
                  </IconButton>

                  <Collapse in={expandedCustomer === customer.customer_id}>
                    <div style={{ marginTop: '10px' }}>
                      {policies.length > 0 ? (
                        <>
                          {policies.map((policy, index) => (
                            <div key={policy.policy_id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                              <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                                {policy.policy_type} - {policy.policy_number} - ${policy.premium}
                              </Typography>
                              <Typography>
                                <strong>Effective:</strong> {formatDate(policy.effective_date)}
                                <br />
                                <strong>Expiration:</strong> {formatDate(policy.expiration_date)}
                              </Typography>
                              <Typography variant="subtitle2" style={{ color: 'red', fontWeight: 'bold' }}>
                                🕒 Days Until Renewal: {calculateDaysUntilRenewal(policy.expiration_date)}
                              </Typography>
                            </div>
                          ))}
                          <Typography variant="subtitle1" style={{ marginTop: '10px', fontWeight: 'bold' }}>
                            Total Premium: ${totalPremium.toFixed(2)}
                          </Typography>
                        </>
                      ) : (
                        <Typography>No policies found.</Typography>
                      )}
                    </div>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </div>
  );
};

export default CustomersPage;
