import React, { useState, useEffect } from 'react';
import {
  getCustomers,
  getPoliciesByCustomer,
  updateCustomer,
  deleteCustomer
} from '../services/api';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Collapse,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Toolbar,
  AppBar,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/system';

//
// A styled Paper for each policy item that
// respects the current MUI theme (dark or light).
//
const PolicyItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`, // a theme-aware border color
}));

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [customerPolicies, setCustomerPolicies] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // For editing a customer
  const [editCustomer, setEditCustomer] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // For searching
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();

        // Sort customers by created_at descending (newest first)
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // For each customer, fetch policies so we can do local searching by policy #
        const policiesByCustomer = {};
        for (let customer of data) {
          try {
            const policies = await getPoliciesByCustomer(customer.customer_id);
            policiesByCustomer[customer.customer_id] = policies;
          } catch (err) {
            console.error('Error fetching policies for customer:', err);
            policiesByCustomer[customer.customer_id] = [];
          }
        }

        setCustomers(data);
        setCustomerPolicies(policiesByCustomer);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  /**
   * Returns true if `searchText` matches:
   *  - The customer's first/last name
   *  - The customer's phone
   *  - Any of the customer's policy_number
   */
  const matchesSearch = (customer) => {
    const text = searchText.toLowerCase().trim();
    if (!text) return true; // no filter

    // Check name
    const nameMatch =
      customer.first_name.toLowerCase().includes(text) ||
      customer.last_name.toLowerCase().includes(text);

    // Check phone
    const phoneMatch =
      customer.phone && customer.phone.toLowerCase().includes(text);

    // Check policy numbers
    const policies = customerPolicies[customer.customer_id] || [];
    const policyNumberMatch = policies.some((p) =>
      p.policy_number.toLowerCase().includes(text)
    );

    return nameMatch || phoneMatch || policyNumberMatch;
  };

  // Filtered list of customers based on the search
  const filteredCustomers = customers.filter(matchesSearch);

  const handleTogglePolicies = (customerId) => {
    setExpandedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  // Save edited customer data
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

  // Open edit dialog
  const openEditDialog = (customer) => {
    const dateOnly = customer.date_of_birth
      ? customer.date_of_birth.split('T')[0]
      : '';

    setEditCustomer({
      ...customer,
      date_of_birth: dateOnly
    });
    setEditOpen(true);
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

  // Simple date formatter (for policy effective/expiration)
  const formatDate = (dateString) =>
    new Date(dateString).toISOString().split('T')[0];

  const calculateDaysUntilRenewal = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const timeDiff = expDate - today;
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Box>
      <AppBar position="static" sx={{ marginBottom: 2 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Customer Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search by name, phone or policy #"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ padding: 2 }}>
        {filteredCustomers.length === 0 ? (
          <Paper sx={{ padding: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1">No matching customers found.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredCustomers.map((customer) => {
              const policies = customerPolicies[customer.customer_id] || [];
              const totalPremium = policies.reduce(
                (sum, policy) => sum + Number(policy.premium || 0),
                0
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={customer.customer_id}>
                  <Card
                    sx={{
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <CardContent sx={{ flex: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {customer.first_name} {customer.last_name}
                        </Typography>
                        <Box>
                          <IconButton
                            onClick={() => openEditDialog(customer)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteCustomer(customer.customer_id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography color="textSecondary">
                        {customer.email}
                      </Typography>
                      <Typography color="textSecondary">
                        {customer.phone}
                      </Typography>
                      <Typography color="textPrimary" sx={{ mt: 1 }}>
                        📍 {customer.address}, {customer.city}, {customer.state}{' '}
                        {customer.zipcode}
                      </Typography>
                    </CardContent>

                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        onClick={() => handleTogglePolicies(customer.customer_id)}
                        endIcon={<ExpandMoreIcon />}
                        sx={{ marginBottom: 1 }}
                      >
                        {expandedCustomer === customer.customer_id
                          ? 'Hide Policies'
                          : 'Show Policies'}
                      </Button>
                    </Box>

                    <Collapse in={expandedCustomer === customer.customer_id}>
                      <CardContent>
                        {policies.length > 0 ? (
                          <>
                            {policies.map((policy) => (
                              <PolicyItem key={policy.policy_id} elevation={2}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {policy.policy_type} - {policy.policy_number} - $
                                  {policy.premium}
                                </Typography>
                                <Typography>
                                  <strong>Effective:</strong>{' '}
                                  {formatDate(policy.effective_date)}
                                  <br />
                                  <strong>Expiration:</strong>{' '}
                                  {formatDate(policy.expiration_date)}
                                </Typography>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ color: 'red', fontWeight: 'bold' }}
                                >
                                  🕒 Days Until Renewal:{' '}
                                  {calculateDaysUntilRenewal(policy.expiration_date)}
                                </Typography>
                              </PolicyItem>
                            ))}
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ marginTop: 1 }}
                            >
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
        )}
      </Box>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          {editCustomer && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={editCustomer.first_name}
                  onChange={(e) =>
                    setEditCustomer({
                      ...editCustomer,
                      first_name: e.target.value
                    })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={editCustomer.last_name}
                  onChange={(e) =>
                    setEditCustomer({
                      ...editCustomer,
                      last_name: e.target.value
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={editCustomer.email}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, email: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={editCustomer.phone || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={editCustomer.address || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, address: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  fullWidth
                  value={editCustomer.city || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, city: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  fullWidth
                  value={editCustomer.state || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, state: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Zipcode"
                  fullWidth
                  value={editCustomer.zipcode || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, zipcode: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={editCustomer.date_of_birth || ''}
                  onChange={(e) =>
                    setEditCustomer({
                      ...editCustomer,
                      date_of_birth: e.target.value
                    })
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleEditCustomer} color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;
