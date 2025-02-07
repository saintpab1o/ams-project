import React, { useState, useEffect } from 'react';
import { getCustomers, getPoliciesByCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { 
  Card, CardContent, Typography, Grid, Collapse, IconButton, Button, TextField, Dialog, DialogActions, 
  DialogContent, DialogTitle, Divider, Box 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [customerPolicies, setCustomerPolicies] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

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

  const handleEditCustomer = async () => {
    try {
      const updated = await updateCustomer(editCustomer.customer_id, editCustomer);
      setCustomers((prev) =>
        prev.map((c) => (c.customer_id === updated.customer_id ? updated : c))
      );
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        setCustomers((prev) => prev.filter((c) => c.customer_id !== id));
      } catch (error) {
        console.error('Error deleting customer:', error);
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
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{customer.first_name} {customer.last_name}</Typography>
                    <Box>
                      <IconButton onClick={() => { setEditCustomer(customer); setEditOpen(true); }} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteCustomer(customer.customer_id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography color="textSecondary">{customer.email}</Typography>
                  <Typography color="textSecondary">{customer.phone}</Typography>
                  <Typography color="textPrimary">
                    📍 {customer.address}, {customer.city}, {customer.state} {customer.zipcode}
                  </Typography>
                  <IconButton onClick={() => handleTogglePolicies(customer.customer_id)}>
                    <ExpandMoreIcon />
                  </IconButton>
                </CardContent>
                <Collapse in={expandedCustomer === customer.customer_id}>
                  <CardContent>
                    {policies.length > 0 ? (
                      <>
                        {policies.map((policy) => (
                          <Box key={policy.policy_id} sx={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '10px' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {policy.policy_type} - {policy.policy_number} - ${policy.premium}
                            </Typography>
                            <Typography>
                              <strong>Effective:</strong> {formatDate(policy.effective_date)}
                              <br />
                              <strong>Expiration:</strong> {formatDate(policy.expiration_date)}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ color: 'red', fontWeight: 'bold' }}>
                              🕒 Days Until Renewal: {calculateDaysUntilRenewal(policy.expiration_date)}
                            </Typography>
                          </Box>
                        ))}
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Premium: ${totalPremium.toFixed(2)}
                        </Typography>
                      </>
                    ) : (
                      <Typography>No policies found.</Typography>
                    )}
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          {editCustomer && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={editCustomer.first_name}
                  onChange={(e) => setEditCustomer({ ...editCustomer, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={editCustomer.last_name}
                  onChange={(e) => setEditCustomer({ ...editCustomer, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={editCustomer.email}
                  onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleEditCustomer} color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
