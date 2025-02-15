import React, { useState, useEffect } from 'react';
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
  Tooltip,
  Container,
  InputAdornment,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  getCustomers,
  getPolicies,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../services/api';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TornadoSharpIcon from '@mui/icons-material/TornadoSharp';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PublicIcon from '@mui/icons-material/Public';
import PinDropIcon from '@mui/icons-material/PinDrop';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';

import TableViewIcon from '@mui/icons-material/TableView';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

import { useNavigate } from 'react-router-dom';

// -------------------------
// High-Risk Hazard States
// -------------------------
const fireStates = new Set(['CA','NV','OR','OK','ID','TX','CO','UT']);
const floodStates = new Set(['FL','TX','NC','LA','SC','AL','GA','MI','NY','MA']);
const tornadoStates = new Set(['IL','AL','CO','TX','MI','NE','IA','GA','OH','TN']);

// -------------------------
// Sample Data (Disney Demo)
// -------------------------
const sampleDisneyData = [
  {
    first_name: 'Mickey',
    last_name: 'Mouse',
    email: 'mickey@disney.com',
    phone: '631-555-1234',
    address: '123 magic way',
    city: 'orlando',
    state: 'fl',
    zipcode: '32830',
    date_of_birth: '1928-11-18'
  },
  {
    first_name: 'Minnie',
    last_name: 'Mouse',
    email: 'minnie@disney.com',
    phone: '123-5555678',
    address: '456 daisy st',
    city: 'toontown',
    state: 'ca',
    zipcode: '90001',
    date_of_birth: '1928-01-01'
  },
  // ... plus more ...
];

// ------------------------------
// Formatting & Validation Utils
// ------------------------------
function titleCaseWords(str) {
  // 1) Title-case each word (for names, addresses)
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatPhone(rawPhone) {
  // 2) Format phone: strip non-digits, then reformat as XXX-XXX-XXXX
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D+/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return digits; // fallback
}

function validateCustomerData(customer) {
  // 3) Validate user input (Add/Edit form).
  //   - All fields required
  //   - 10-digit phone
  //   - Basic checks for name, email, etc.
  const errors = [];
  const requiredFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'zipcode',
    'date_of_birth'
  ];

  // Check empty fields
  requiredFields.forEach((field) => {
    if (!customer[field] || !customer[field].trim()) {
      errors.push(`${field} is required.`);
    }
  });

  // If all fields are present, do deeper checks:
  // Name checks: must not contain digits or phone-like patterns
  const letterRegex = /^[a-zA-Z\s]+$/;

  if (customer.first_name && !letterRegex.test(customer.first_name.trim())) {
    errors.push('First name must contain only letters/spaces.');
  }
  if (customer.last_name && !letterRegex.test(customer.last_name.trim())) {
    errors.push('Last name must contain only letters/spaces.');
  }

  // Email (naive check)
  if (customer.email && (!customer.email.includes('@') || !customer.email.includes('.'))) {
    errors.push('Invalid email address.');
  }

  // Phone: must be exactly 10 digits
  const digitCount = (customer.phone || '').replace(/\D/g, '').length;
  if (digitCount !== 10) {
    errors.push('Phone number must be exactly 10 digits.');
  }

  // State: letters only (2-20 length)
  const stateRegex = /^[a-zA-Z]{2,20}$/;
  if (customer.state && !stateRegex.test(customer.state.trim())) {
    errors.push('State must contain only letters (2-20 characters).');
  }

  return errors;
}

function formatDate(dateString) {
  // Convert date to YYYY-MM-DD
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

function calculateDaysUntilRenewal(expirationDate) {
  // Compare expiration date to today's date
  if (!expirationDate) return 0;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const timeDiff = expDate - today;
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
}

// -------------------------
// CustomersPage Component
// -------------------------
const CustomersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme(); // For dark/light mode styling

  const [customers, setCustomers] = useState([]);
  const [customerPoliciesMap, setCustomerPoliciesMap] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // For editing an existing customer
  const [editCustomer, setEditCustomer] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // For creating a new customer
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    date_of_birth: ''
  });
  const [newOpen, setNewOpen] = useState(false);

  // For searching
  const [searchText, setSearchText] = useState('');

  // For validation errors
  const [formErrors, setFormErrors] = useState([]);

  // For custom delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // For toggling between card-view vs table-view
  // Default now set to "table" to show Salesforce style first.
  const [viewMode, setViewMode] = useState('table'); // "cards" | "table"

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const custData = await getCustomers();
      // Sort newest->oldest
      custData.sort((a, b) => b.customer_id - a.customer_id);
      setCustomers(custData);

      const polData = await getPolicies();
      const policyMap = {};
      for (const p of polData) {
        if (!policyMap[p.customer_id]) {
          policyMap[p.customer_id] = [];
        }
        policyMap[p.customer_id].push(p);
      }
      setCustomerPoliciesMap(policyMap);
    } catch (error) {
      console.error('Error fetching customers/policies:', error);
    }
  }

  // Toggle expand for policies
  const handleTogglePolicies = (customerId) => {
    setExpandedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  // -----------------------
  // ADD NEW CUSTOMER
  // -----------------------
  const openNewCustomerDialog = () => {
    setNewCustomer({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      date_of_birth: ''
    });
    setFormErrors([]);
    setNewOpen(true);
  };

  async function handleCreateCustomer() {
    const errors = validateCustomerData(newCustomer);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    // sanitize
    const sanitized = {
      ...newCustomer,
      first_name: titleCaseWords(newCustomer.first_name),
      last_name: titleCaseWords(newCustomer.last_name),
      address: titleCaseWords(newCustomer.address),
      city: titleCaseWords(newCustomer.city),
      state: newCustomer.state.toUpperCase(),
      phone: newCustomer.phone.replace(/\D/g, '')
    };

    try {
      const created = await createCustomer(sanitized);
      setCustomers((prev) => [created, ...prev]);
      setNewOpen(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      setFormErrors(['Error creating customer. Please try again.']);
    }
  }

  // LOAD SAMPLE DATA
  const handleLoadSample = () => {
    const randomIndex = Math.floor(Math.random() * sampleDisneyData.length);
    setNewCustomer(sampleDisneyData[randomIndex]);
    setFormErrors([]);
  };

  // GENERATE QUOTE
  const handleGenerateQuoteFromNew = () => {
    navigate('/quoting', { state: { prefill: newCustomer } });
  };

  // -----------------------
  // EDIT EXISTING
  // -----------------------
  const openEditDialog = (customer) => {
    setFormErrors([]);
    const dateOnly = customer.date_of_birth
      ? customer.date_of_birth.split('T')[0]
      : '';

    setEditCustomer({
      ...customer,
      date_of_birth: dateOnly
    });
    setEditOpen(true);
  };

  async function handleEditCustomer() {
    if (!editCustomer) return;
    const errors = validateCustomerData(editCustomer);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const sanitized = {
      ...editCustomer,
      first_name: titleCaseWords(editCustomer.first_name),
      last_name: titleCaseWords(editCustomer.last_name),
      address: titleCaseWords(editCustomer.address),
      city: titleCaseWords(editCustomer.city),
      state: editCustomer.state.toUpperCase(),
      phone: editCustomer.phone.replace(/\D/g, '')
    };

    try {
      const updated = await updateCustomer(editCustomer.customer_id, sanitized);
      setCustomers((prev) =>
        prev.map((c) => (c.customer_id === updated.customer_id ? updated : c))
      );
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      setFormErrors(['Error updating customer. Please try again.']);
    }
  }

  // -----------------------
  // DELETE
  // -----------------------
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.customer_id);
      setCustomers((prev) =>
        prev.filter((c) => c.customer_id !== customerToDelete.customer_id)
      );
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  // Hazard icons
  function getHazardIcons(st) {
    const icons = [];
    if (fireStates.has(st)) {
      icons.push(
        <Tooltip key={`fire-${st}`} title="High-risk fire exposure">
          <LocalFireDepartmentIcon sx={{ marginLeft: 1, color: 'red' }} />
        </Tooltip>
      );
    }
    if (floodStates.has(st)) {
      icons.push(
        <Tooltip key={`water-${st}`} title="High-risk flood exposure">
          <WaterDropIcon sx={{ marginLeft: 1, color: 'blue' }} />
        </Tooltip>
      );
    }
    if (tornadoStates.has(st)) {
      icons.push(
        <Tooltip key={`tornado-${st}`} title="High-risk tornado exposure">
          <TornadoSharpIcon sx={{ marginLeft: 1, color: 'gray' }} />
        </Tooltip>
      );
    }
    return icons;
  }

  // Searching logic
  function matchesSearch(customer) {
    const text = searchText.toLowerCase().trim();
    if (!text) return true;

    const fullName = (customer.first_name + ' ' + customer.last_name).toLowerCase();
    if (fullName.includes(text)) return true;

    const phoneDigits = customer.phone.replace(/\D/g, '');
    if (phoneDigits.includes(text.replace(/\D/g, ''))) {
      return true;
    }

    const pols = customerPoliciesMap[customer.customer_id] || [];
    const policyMatch = pols.some((p) =>
      p.policy_number.toLowerCase().includes(text)
    );
    if (policyMatch) return true;

    return false;
  }

  // Display helpers
  function displayPhone(phone) {
    return formatPhone(phone);
  }

  function displayAddress(addr) {
    return titleCaseWords(addr || '');
  }

  function displayName(name) {
    return titleCaseWords(name || '');
  }

  function displayState(st) {
    return (st || '').toUpperCase();
  }

  function displayCustomerSince(customer) {
    if (customer.created_at) {
      const date = new Date(customer.created_at);
      return date.toLocaleDateString();
    }
    return '(Unknown)';
  }

  const filteredCustomers = customers.filter(matchesSearch);

  const handleGetQuote = (customer) => {
    navigate('/quoting', { state: { prefill: customer } });
  };

  // Check if a field is among the error messages -> highlight in red
  function fieldHasError(field) {
    return formErrors.some((err) => err.toLowerCase().includes(field));
  }

  return (
    <Container>
      {/* Top toolbar: Search + Add Customer + View Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          label="Search by name, phone, or policy #"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 400, marginRight: 2 }}
        />
        <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </Typography>

        {/* Toggle View */}
        <Tooltip
          title={`Switch to ${viewMode === 'cards' ? 'Table' : 'Card'} view`}
        >
          <IconButton
            onClick={() =>
              setViewMode((prev) => (prev === 'cards' ? 'table' : 'cards'))
            }
            sx={{ color: 'secondary.main', marginRight: 2 }}
          >
            {viewMode === 'cards' ? <TableViewIcon /> : <ViewModuleIcon />}
          </IconButton>
        </Tooltip>

        {/* Add Customer button */}
        <Tooltip title="Add New Customer">
          <IconButton onClick={openNewCustomerDialog} sx={{ color: 'green' }}>
            <AddCircleIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          {customerToDelete && (
            <Typography>
              Are you sure you want to delete{' '}
              <strong>
                {customerToDelete.first_name} {customerToDelete.last_name}
              </strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteDialog}
            color="secondary"
            variant="contained"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteCustomer}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT CUSTOMER DIALOG */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          {formErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </Alert>
          )}

          {editCustomer && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={editCustomer.first_name}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, first_name: e.target.value })
                  }
                  error={fieldHasError('first_name')}
                  helperText={
                    fieldHasError('first_name') ? 'Invalid First Name' : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={editCustomer.last_name}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, last_name: e.target.value })
                  }
                  error={fieldHasError('last_name')}
                  helperText={
                    fieldHasError('last_name') ? 'Invalid Last Name' : ''
                  }
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
                  fullWidth
                  value={editCustomer.email}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, email: e.target.value })
                  }
                  error={fieldHasError('email')}
                  helperText={fieldHasError('email') ? 'Invalid Email' : ''}
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
                  fullWidth
                  value={editCustomer.phone || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, phone: e.target.value })
                  }
                  error={fieldHasError('phone')}
                  helperText={
                    fieldHasError('phone') ? 'Phone must be 10 digits' : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    )
                  }}
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
                  error={fieldHasError('address')}
                  helperText={fieldHasError('address') ? 'Address required' : ''}
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
                  fullWidth
                  value={editCustomer.city || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, city: e.target.value })
                  }
                  error={fieldHasError('city')}
                  helperText={fieldHasError('city') ? 'City required' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon />
                      </InputAdornment>
                    )
                  }}
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
                  error={fieldHasError('state')}
                  helperText={fieldHasError('state') ? 'Invalid State' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicIcon />
                      </InputAdornment>
                    )
                  }}
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
                  error={fieldHasError('zipcode')}
                  helperText={fieldHasError('zipcode') ? 'Zipcode required' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PinDropIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={editCustomer.date_of_birth || ''}
                  onChange={(e) =>
                    setEditCustomer({ ...editCustomer, date_of_birth: e.target.value })
                  }
                  error={fieldHasError('date_of_birth')}
                  helperText={
                    fieldHasError('date_of_birth') ? 'Birth date required' : ''
                  }
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setEditOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditCustomer}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW CUSTOMER DIALOG */}
      <Dialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h5" component="div" fontWeight="bold">
            Add New Customer
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {formErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </Alert>
          )}

          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            {/* Top row: "Load Sample Data" & "Generate Quote" */}
            <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
              <Button
                variant="contained"
                color="warning"
                onClick={handleLoadSample}
                startIcon={<AutoFixHighIcon />}
              >
                Load Sample Data
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateQuoteFromNew}
                startIcon={<MonetizationOnIcon />}
              >
                Generate Quote
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={newCustomer.first_name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, first_name: e.target.value })
                  }
                  error={fieldHasError('first_name')}
                  helperText={
                    fieldHasError('first_name') ? 'Invalid First Name' : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={newCustomer.last_name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, last_name: e.target.value })
                  }
                  error={fieldHasError('last_name')}
                  helperText={
                    fieldHasError('last_name') ? 'Invalid Last Name' : ''
                  }
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
                  fullWidth
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  error={fieldHasError('email')}
                  helperText={fieldHasError('email') ? 'Invalid Email' : ''}
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
                  fullWidth
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  error={fieldHasError('phone')}
                  helperText={
                    fieldHasError('phone') ? 'Phone must be 10 digits' : ''
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Address"
                  fullWidth
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  error={fieldHasError('address')}
                  helperText={fieldHasError('address') ? 'Address required' : ''}
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
                  fullWidth
                  value={newCustomer.city}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, city: e.target.value })
                  }
                  error={fieldHasError('city')}
                  helperText={fieldHasError('city') ? 'City required' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  fullWidth
                  value={newCustomer.state}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, state: e.target.value })
                  }
                  error={fieldHasError('state')}
                  helperText={fieldHasError('state') ? 'Invalid State' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Zipcode"
                  fullWidth
                  value={newCustomer.zipcode}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, zipcode: e.target.value })
                  }
                  error={fieldHasError('zipcode')}
                  helperText={fieldHasError('zipcode') ? 'Zipcode required' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PinDropIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={newCustomer.date_of_birth}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, date_of_birth: e.target.value })
                  }
                  error={fieldHasError('date_of_birth')}
                  helperText={
                    fieldHasError('date_of_birth') ? 'Birth date required' : ''
                  }
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
            </Grid>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setNewOpen(false)}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateCustomer}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------- */}
      {/* RENDER: Depending on viewMode         */}
      {/* ------------------------------------- */}
      {viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {filteredCustomers.map((customer) => {
            const policies = customerPoliciesMap[customer.customer_id] || [];
            const totalPremium = policies.reduce(
              (sum, policy) => sum + Number(policy.premium || 0),
              0
            );

            const hazardIcons = getHazardIcons(customer.state);
            const isExpanded = expandedCustomer === customer.customer_id;

            return (
              <Grid item xs={12} sm={6} md={4} key={customer.customer_id}>
                <Card>
                  <CardContent>
                    {/* TOP ROW: Name & hazard icons */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {displayName(customer.first_name)}{' '}
                        {displayName(customer.last_name)}
                      </Typography>
                      <Box display="flex" alignItems="center">
                        {hazardIcons}
                      </Box>
                    </Box>

                    {/* "Customer Since" date */}
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: 'italic', color: 'gray' }}
                    >
                      Customer Since: {displayCustomerSince(customer)}
                    </Typography>

                    {/* Email & Phone */}
                    <Typography variant="body1" color="textSecondary">
                      {customer.email}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {displayPhone(customer.phone)}
                    </Typography>

                    {/* Address row */}
                    <Typography variant="body2" sx={{ marginTop: 1 }}>
                      📍 {displayAddress(customer.address)},{' '}
                      {displayAddress(customer.city)},{' '}
                      {displayState(customer.state)} {customer.zipcode}
                    </Typography>

                    {/* EDIT & DELETE row + Expand & Quote */}
                    <Box
                      mt={1}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            onClick={() => openEditDialog(customer)}
                            color="primary"
                            size="small"
                            sx={{ marginRight: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Customer">
                          <IconButton
                            onClick={() => handleDeleteClick(customer)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box>
                        <Tooltip title="View Policies">
                          <IconButton
                            onClick={() => handleTogglePolicies(customer.customer_id)}
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="contained"
                          sx={{ ml: 1 }}
                          onClick={() => handleGetQuote(customer)}
                        >
                          Generate Quote
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>

                  <Collapse in={isExpanded}>
                    <CardContent
                      sx={{
                        borderTop: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      {policies.length > 0 ? (
                        <>
                          {policies.map((policy) => (
                            <Box
                              key={policy.policy_id}
                              sx={{
                                p: 1,
                                border: 1,
                                borderRadius: 1,
                                borderColor: 'divider',
                                mb: 1
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold">
                                {policy.policy_type.toUpperCase()} -{' '}
                                {policy.policy_number}
                              </Typography>
                              <Typography>
                                💲 Premium: <strong>${policy.premium}</strong>
                              </Typography>
                              <Typography>
                                📅 Effective: {formatDate(policy.effective_date)}
                              </Typography>
                              <Typography>
                                📅 Expiration: {formatDate(policy.expiration_date)}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{ color: 'red', fontWeight: 'bold' }}
                              >
                                🕒 Days Until Renewal:{' '}
                                {calculateDaysUntilRenewal(
                                  policy.expiration_date
                                )}
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
      ) : (
        // TABLE VIEW MODE
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>Phone</strong>
                </TableCell>
                <TableCell>
                  <strong>Address</strong>
                </TableCell>
                <TableCell>
                  <strong>State</strong>
                </TableCell>
                <TableCell>
                  <strong>Customer Since</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const policies = customerPoliciesMap[customer.customer_id] || [];
                const totalPremium = policies.reduce(
                  (sum, policy) => sum + Number(policy.premium || 0),
                  0
                );

                const hazardIcons = getHazardIcons(customer.state);
                const isExpanded = expandedCustomer === customer.customer_id;

                return (
                  <React.Fragment key={customer.customer_id}>
                    {/* Main row */}
                    <TableRow
                      hover
                      onClick={() => handleTogglePolicies(customer.customer_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography sx={{ fontWeight: 'bold' }}>
                            {displayName(customer.first_name)}{' '}
                            {displayName(customer.last_name)}
                          </Typography>
                          {/* hazard icons next to name */}
                          {hazardIcons.map((icon, idx) => (
                            <span key={idx}>{icon}</span>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{displayPhone(customer.phone)}</TableCell>
                      <TableCell>
                        {displayAddress(customer.address)},{' '}
                        {displayAddress(customer.city)} {customer.zipcode}
                      </TableCell>
                      <TableCell>{displayState(customer.state)}</TableCell>
                      <TableCell>{displayCustomerSince(customer)}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(customer);
                            }}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Customer">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(customer);
                            }}
                            color="error"
                            size="small"
                            sx={{ marginLeft: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Generate Quote">
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ ml: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGetQuote(customer);
                            }}
                          >
                            Quote
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row for policies */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{
                            backgroundColor: theme.palette.action.hover
                          }}
                        >
                          {policies.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                              {/* Nested table for policies */}
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Policy Type</strong></TableCell>
                                    <TableCell><strong>Policy #</strong></TableCell>
                                    <TableCell><strong>Premium</strong></TableCell>
                                    <TableCell><strong>Effective</strong></TableCell>
                                    <TableCell><strong>Expiration</strong></TableCell>
                                    <TableCell><strong>Days Until Renewal</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {policies.map((policy) => {
                                    const daysUntil = calculateDaysUntilRenewal(
                                      policy.expiration_date
                                    );
                                    return (
                                      <TableRow key={policy.policy_id}>
                                        <TableCell>
                                          {policy.policy_type.toUpperCase()}
                                        </TableCell>
                                        <TableCell>{policy.policy_number}</TableCell>
                                        <TableCell>${policy.premium}</TableCell>
                                        <TableCell>
                                          {formatDate(policy.effective_date)}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(policy.expiration_date)}
                                        </TableCell>
                                        <TableCell
                                          sx={{ color: 'red', fontWeight: 'bold' }}
                                        >
                                          {daysUntil}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  {/* Footer row: total premium */}
                                  <TableRow>
                                    <TableCell colSpan={2} />
                                    <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>
                                      Total Premium: ${totalPremium.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </Box>
                          ) : (
                            <Typography sx={{ m: 2 }}>
                              No policies found.
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default CustomersPage;
