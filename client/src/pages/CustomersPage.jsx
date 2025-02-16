import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Container,
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
import { useNavigate } from 'react-router-dom';

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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PersonIcon from '@mui/icons-material/Person'; // Person icon for linking to detail page

import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TornadoSharpIcon from '@mui/icons-material/TornadoSharp';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

// ----------------------------
// SAMPLE DISNEY DATA
// ----------------------------
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
];

// ----------------------------
// Hazard sets
// ----------------------------
const fireStates = new Set(['CA','NV','OR','OK','ID','TX','CO','UT']);
const floodStates = new Set(['FL','TX','NC','LA','SC','AL','GA','MI','NY','MA']);
const tornadoStates = new Set(['IL','AL','CO','TX','MI','NE','IA','GA','OH','TN']);

// ----------------------------
// Utility & Validation
// ----------------------------
function titleCaseWords(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D+/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return digits;
}

function validateCustomerData(customer) {
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

  requiredFields.forEach((field) => {
    if (!customer[field] || !customer[field].trim()) {
      errors.push(`${field} is required.`);
    }
  });

  const letterRegex = /^[a-zA-Z\s]+$/;
  if (customer.first_name && !letterRegex.test(customer.first_name.trim())) {
    errors.push('First name must contain only letters/spaces.');
  }
  if (customer.last_name && !letterRegex.test(customer.last_name.trim())) {
    errors.push('Last name must contain only letters/spaces.');
  }
  if (customer.email && (!customer.email.includes('@') || !customer.email.includes('.'))) {
    errors.push('Invalid email address.');
  }

  const digitCount = (customer.phone || '').replace(/\D/g, '').length;
  if (digitCount !== 10) {
    errors.push('Phone number must be exactly 10 digits.');
  }

  const stateRegex = /^[a-zA-Z]{2,20}$/;
  if (customer.state && !stateRegex.test(customer.state.trim())) {
    errors.push('State must contain only letters (2-20 characters).');
  }

  return errors;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

function calculateDaysUntilRenewal(expirationDate) {
  if (!expirationDate) return 0;
  const exp = new Date(expirationDate);
  const today = new Date();
  const diff = exp - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function sortPoliciesByDaysUntilRenewal(policies) {
  return [...policies].sort(
    (a, b) =>
      calculateDaysUntilRenewal(a.expiration_date) -
      calculateDaysUntilRenewal(b.expiration_date)
  );
}

function getHazardIcons(st) {
  const icons = [];
  if (fireStates.has(st)) {
    icons.push(
      <LocalFireDepartmentIcon
        key="fire"
        sx={{ ml: 0.5, color: 'red' }}
        titleAccess="High-risk fire exposure"
      />
    );
  }
  if (floodStates.has(st)) {
    icons.push(
      <WaterDropIcon
        key="water"
        sx={{ ml: 0.5, color: 'blue' }}
        titleAccess="High-risk flood exposure"
      />
    );
  }
  if (tornadoStates.has(st)) {
    icons.push(
      <TornadoSharpIcon
        key="tornado"
        sx={{ ml: 0.5, color: 'gray' }}
        titleAccess="High-risk tornado exposure"
      />
    );
  }
  return icons;
}

// ----------------------------
// CustomersPage
// ----------------------------
const CustomersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [customers, setCustomers] = useState([]);
  const [customerPoliciesMap, setCustomerPoliciesMap] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // For editing
  const [editCustomer, setEditCustomer] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // For creating
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

  // Searching
  const [searchText, setSearchText] = useState('');
  // Validation
  const [formErrors, setFormErrors] = useState([]);
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Card vs table
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const custData = await getCustomers();
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
      console.error('Error fetching data:', error);
    }
  }

  // Expand row to show policies
  const handleTogglePolicies = (customerId) => {
    setExpandedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  // NEW Customer
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

  const handleLoadSample = () => {
    const idx = Math.floor(Math.random() * sampleDisneyData.length);
    setNewCustomer(sampleDisneyData[idx]);
    setFormErrors([]);
  };

  const handleGenerateQuoteFromNew = () => {
    navigate('/quoting', { state: { prefill: newCustomer } });
  };

  // EDIT
  const openEditDialog = (customer) => {
    setFormErrors([]);
    const dateOnly = customer.date_of_birth ? customer.date_of_birth.split('T')[0] : '';
    setEditCustomer({ ...customer, date_of_birth: dateOnly });
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

  // DELETE
  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.customer_id);
      setCustomers((prev) => prev.filter((c) => c.customer_id !== customerToDelete.customer_id));
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

  // Searching
  function matchesSearch(customer) {
    const txt = searchText.toLowerCase().trim();
    if (!txt) return true;

    const fullName = (customer.first_name + ' ' + customer.last_name).toLowerCase();
    if (fullName.includes(txt)) return true;

    const phoneDigits = (customer.phone || '').replace(/\D/g, '');
    if (phoneDigits.includes(txt.replace(/\D/g, ''))) return true;

    const pols = customerPoliciesMap[customer.customer_id] || [];
    const policyMatch = pols.some((p) =>
      p.policy_number.toLowerCase().includes(txt)
    );
    if (policyMatch) return true;

    return false;
  }

  // PDF doc generation (no images)
  const handleDownloadPolicyDoc = (policy, customer) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const now = new Date();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('SecureShield Insurance Agency', 50, 50);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Policy Document', 50, 70);

      doc.setDrawColor(160);
      doc.setLineWidth(0.7);
      doc.line(50, 80, 550, 80);

      let curY = 90;
      doc.text('Issued by SecureShield Insurance Agency', 50, curY);
      curY += 12;
      doc.text('1234 Market St, Springfield, USA', 50, curY);
      curY += 12;
      doc.text('Phone: (800) 555-1234 | Web: secureshieldexample.com', 50, curY);
      doc.text(`Date Issued: ${now.toLocaleDateString()}`, 400, 50);

      curY += 30;
      doc.setDrawColor(180);
      doc.setLineWidth(1);
      doc.rect(45, curY - 10, 520, 90);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Customer Details', 50, curY);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      let nextLine = curY + 16;
      doc.text(`Name: ${customer.first_name} ${customer.last_name}`, 50, nextLine);
      nextLine += 14;
      doc.text(`Phone: ${formatPhone(customer.phone)}`, 50, nextLine);
      nextLine += 14;
      doc.text(
        `Address: ${titleCaseWords(customer.address)}, ${titleCaseWords(customer.city)}, ${customer.state.toUpperCase()} ${customer.zipcode}`,
        50,
        nextLine
      );
      nextLine += 14;

      const createdAt = customer.created_at ? new Date(customer.created_at) : null;
      const diffDays = createdAt ? (Date.now() - createdAt) / (1000*3600*24) : 0;
      const custSince = createdAt ? createdAt.toLocaleDateString() : '(Unknown)';
      let platinum = false;
      if (diffDays > 365) {
        platinum = true;
      }

      doc.text(`Customer Since: ${custSince}`, 50, nextLine);
      if (platinum) {
        doc.setTextColor(230, 0, 120);
        doc.setFont('helvetica', 'bold');
        doc.text('Platinum Customer ★', 280, nextLine);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }

      curY += 90;
      curY += 15;
      doc.setDrawColor(180);
      doc.rect(45, curY - 10, 520, 110);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Policy Details', 50, curY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      nextLine = curY + 16;
      doc.text(`Policy #: ${policy.policy_number}`, 50, nextLine);
      nextLine += 14;
      doc.text(`Policy Type: ${policy.policy_type.toUpperCase()}`, 50, nextLine);
      nextLine += 14;
      doc.text(`Premium: $${policy.premium}`, 50, nextLine);
      nextLine += 14;
      doc.text(`Effective: ${formatDate(policy.effective_date)}`, 50, nextLine);
      nextLine += 14;
      doc.text(`Expiration: ${formatDate(policy.expiration_date)}`, 50, nextLine);
      nextLine += 14;
      const daysUntil = calculateDaysUntilRenewal(policy.expiration_date);
      doc.text(`Days Until Renewal: ${daysUntil}`, 50, nextLine);

      let footY = curY + 125;
      doc.setDrawColor(160);
      doc.setLineWidth(0.5);
      doc.line(50, footY, 550, footY);
      footY += 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for choosing SecureShield Insurance Agency!', 50, footY);
      footY += 14;
      doc.text('Please contact your agent for additional details or changes.', 50, footY);

      const pdfUrl = doc.output('bloburl');
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate policy PDF');
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Top toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          label="Search by name, phone, or policy #"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 400, mr: 2 }}
        />
        <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
          Showing {customers.filter(matchesSearch).length} of {customers.length} customers
        </Typography>

        <Tooltip title={`Switch to ${viewMode === 'cards' ? 'Table' : 'cards'} view`}>
          <IconButton
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            sx={{ color: 'secondary.main', mr: 2 }}
          >
            {viewMode === 'cards' ? <TableViewIcon /> : <ViewModuleIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Add New Customer">
          <IconButton onClick={openNewCustomerDialog} sx={{ color: 'green' }}>
            <AddCircleIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent dividers>
          {customerToDelete && (
            <Typography>
              Are you sure you want to delete{' '}
              <strong>{customerToDelete.first_name} {customerToDelete.last_name}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="secondary" variant="contained">
            Cancel
          </Button>
          <Button onClick={confirmDeleteCustomer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent dividers>
          {formErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.map((err, idx) => <div key={idx}>{err}</div>)}
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
                />
              </Grid>
              {/* Repeat for last_name, email, phone, etc. */}
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
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h5" component="div" fontWeight="bold">
            Add New Customer
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {formErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.map((err, idx) => <div key={idx}>{err}</div>)}
            </Alert>
          )}
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
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
                />
              </Grid>
              {/* Repeat for last_name, email, phone, address, etc. */}
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

      {/* MAIN CONTENT: Cards or Table */}
      {viewMode === 'cards' ? (
        // CARD VIEW
        <Grid container spacing={2}>
          {customers.filter(matchesSearch).map((customer) => {
            const rawPolicies = customerPoliciesMap[customer.customer_id] || [];
            const policies = sortPoliciesByDaysUntilRenewal(rawPolicies);
            const totalPremium = policies.reduce(
              (sum, p) => sum + Number(p.premium || 0),
              0
            );
            const isExpanded = expandedCustomer === customer.customer_id;

            return (
              <Grid item xs={12} sm={6} md={4} key={customer.customer_id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {titleCaseWords(customer.first_name)} {titleCaseWords(customer.last_name)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'gray' }}>
                      Customer Since:{' '}
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : '(Unknown)'}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {customer.email}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {formatPhone(customer.phone)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      📍 {titleCaseWords(customer.address)}, {titleCaseWords(customer.city)},{' '}
                      {(customer.state || '').toUpperCase()} {customer.zipcode}
                    </Typography>

                    <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            onClick={() => openEditDialog(customer)}
                            color="primary"
                            size="small"
                            sx={{ mr: 1 }}
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
                          <IconButton onClick={() => handleTogglePolicies(customer.customer_id)}>
                            <ExpandMoreIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>

                  <Collapse in={isExpanded}>
                    <CardContent sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                      {policies.length > 0 ? (
                        <>
                          {policies.map((policy) => {
                            const days = calculateDaysUntilRenewal(policy.expiration_date);
                            return (
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
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {policy.policy_type.toUpperCase()} - {policy.policy_number}
                                </Typography>
                                <Typography>
                                  💲 Premium: <strong>${policy.premium}</strong>
                                </Typography>
                                <Typography>
                                  📅 Expiration: {formatDate(policy.expiration_date)}
                                </Typography>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ color: 'red', fontWeight: 'bold' }}
                                >
                                  🕒 Days Until Renewal: {days}
                                </Typography>

                                <Tooltip title="Download Policy PDF">
                                  <IconButton
                                    onClick={() => handleDownloadPolicyDoc(policy, customer)}
                                    sx={{ mt: 1 }}
                                  >
                                    <PictureAsPdfIcon color="primary" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            );
                          })}
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
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
        // TABLE VIEW
        <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>State</strong></TableCell>
                <TableCell><strong>Customer Since</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.filter(matchesSearch).map((customer) => {
                const rawPolicies = customerPoliciesMap[customer.customer_id] || [];
                const policies = sortPoliciesByDaysUntilRenewal(rawPolicies);
                const totalPremium = policies.reduce(
                  (sum, p) => sum + Number(p.premium || 0),
                  0
                );
                const isExpanded = expandedCustomer === customer.customer_id;

                return (
                  <React.Fragment key={customer.customer_id}>
                    <TableRow
                      hover
                      onClick={() => handleTogglePolicies(customer.customer_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {/* ADDED PERSON ICON to left of name */}
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Tooltip title="View Customer Detail">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/${customer.customer_id}`);
                              }}
                              size="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <PersonIcon />
                            </IconButton>
                          </Tooltip>

                          <Typography sx={{ fontWeight: 'bold' }}>
                            {titleCaseWords(customer.first_name)} {titleCaseWords(customer.last_name)}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{formatPhone(customer.phone)}</TableCell>
                      <TableCell>
                        {titleCaseWords(customer.address)}, {titleCaseWords(customer.city)}{' '}
                        {customer.zipcode}
                      </TableCell>
                      <TableCell>{(customer.state || '').toUpperCase()}</TableCell>
                      <TableCell>
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString()
                          : '(Unknown)'}
                      </TableCell>
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
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ backgroundColor: theme.palette.action.hover }}>
                          {policies.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Policy Type</strong></TableCell>
                                    <TableCell><strong>Policy #</strong></TableCell>
                                    <TableCell><strong>Premium</strong></TableCell>
                                    <TableCell><strong>Expiration</strong></TableCell>
                                    <TableCell><strong>Days Until Renewal</strong></TableCell>
                                    <TableCell><strong>Docs</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {policies.map((policy) => {
                                    const days = calculateDaysUntilRenewal(policy.expiration_date);
                                    return (
                                      <TableRow key={policy.policy_id}>
                                        <TableCell>
                                          {policy.policy_type.toUpperCase()}
                                        </TableCell>
                                        <TableCell>{policy.policy_number}</TableCell>
                                        <TableCell>${policy.premium}</TableCell>
                                        <TableCell>{formatDate(policy.expiration_date)}</TableCell>
                                        <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>
                                          {days}
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title="Download Policy PDF">
                                            <IconButton
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadPolicyDoc(policy, customer);
                                              }}
                                              size="small"
                                            >
                                              <PictureAsPdfIcon color="primary" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
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
                            <Typography sx={{ m: 2 }}>No policies found.</Typography>
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
