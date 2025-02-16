import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// For PDF generation (if you want to replicate your existing snippet)
import { jsPDF } from 'jspdf';

// MUI Components
import {
  Container,
  Typography,
  Grid,
  Box,
  Paper,
  Alert,
  TextField,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';

// Icons
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TornadoSharpIcon from '@mui/icons-material/TornadoSharp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

// Example API calls (replace with your real services)
import { getCustomers, getPoliciesByCustomer } from '../services/api';

// ------------------------------------
// Hazard Sets & Utility (from your snippet)
// ------------------------------------
const fireStates = new Set(['CA','NV','OR','OK','ID','TX','CO','UT']);
const floodStates = new Set(['FL','TX','NC','LA','SC','AL','GA','MI','NY','MA']);
const tornadoStates = new Set(['IL','AL','CO','TX','MI','NE','IA','GA','OH','TN']);

function getHazardIcons(st) {
  const icons = [];
  if (fireStates.has(st)) {
    icons.push(
      <Tooltip key="fire" title="High-risk fire exposure">
        <LocalFireDepartmentIcon sx={{ ml: 0.5, color: 'red' }} />
      </Tooltip>
    );
  }
  if (floodStates.has(st)) {
    icons.push(
      <Tooltip key="flood" title="High-risk flood exposure">
        <WaterDropIcon sx={{ ml: 0.5, color: 'blue' }} />
      </Tooltip>
    );
  }
  if (tornadoStates.has(st)) {
    icons.push(
      <Tooltip key="tornado" title="High-risk tornado exposure">
        <TornadoSharpIcon sx={{ ml: 0.5, color: 'gray' }} />
      </Tooltip>
    );
  }
  return icons;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

function calculateDaysUntilRenewal(expirationDate) {
  if (!expirationDate) return 0;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const diff = expDate - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatPhone(rawPhone = '') {
  const digits = rawPhone.replace(/\D+/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return rawPhone;
}

// Simple PDF logic
function handleDownloadPolicyDoc(policy, customer) {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SecureShield Insurance Agency', 50, 50);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Policy: ${policy.policy_number}`, 50, 100);
    doc.text(`Customer: ${customer.first_name} ${customer.last_name}`, 50, 120);

    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Failed to generate PDF');
  }
}

// ------------------------------------
// Dark Styling (no changes from before)
// ------------------------------------
const darkPaperStyle = {
  backgroundColor: '#2D2F36',
  color: '#FFFFFF',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '16px'
};
const darkTableStyle = {
  backgroundColor: '#42434a',
  color: '#fff'
};
const sectionTitleStyle = {
  fontWeight: 'bold',
  marginBottom: '8px'
};

// For the Domino's Pizza–style lead steps:
const leadSteps = ['New Lead', 'Qualified', 'Opportunity', 'Closed Won', 'Closed Lost'];

const CustomerDetailPage = () => {
  const { customerId } = useParams();

  // Data states
  const [customer, setCustomer] = useState(null);
  const [policies, setPolicies] = useState([]);

  // Additional feature states
  const [leadStage, setLeadStage] = useState('New Lead'); 
  const [notes, setNotes] = useState('');
  const [lifeEvents, setLifeEvents] = useState([]);
  const [campaigns, setCampaigns] = useState([
    { name: 'Renewal 30-Day Reminder', active: true },
    { name: 'Birthday Email', active: false }
  ]);

  // Alert message
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const allCustomers = await getCustomers();
        const found = allCustomers.find(
          (c) => c.customer_id === parseInt(customerId, 10)
        );
        setCustomer(found || null);

        if (found) {
          const polData = await getPoliciesByCustomer(customerId);
          setPolicies(polData);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
    };
    fetchCustomerData();
  }, [customerId]);

  // Life events, notes, leadStage, etc.
  const handleAddLifeEvent = () => {
    const example = {
      title: 'Son turning 16',
      date: '2025-07-01'
    };
    setLifeEvents((prev) => [...prev, example]);
    setAlertMsg('New life event added!');
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const handleSaveNotes = () => {
    console.log('Saving notes:', notes);
    setAlertMsg('Notes saved.');
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const handleChangeLeadStage = (newStage) => {
    setLeadStage(newStage);
    setAlertMsg(`Lead stage updated to: ${newStage}`);
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const toggleCampaign = (index) => {
    setCampaigns((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, active: !c.active } : c
      )
    );
  };

  if (!customer) {
    return (
      <Container>
        <Paper sx={darkPaperStyle}>
          <Typography variant="h5">Loading customer data...</Typography>
        </Paper>
      </Container>
    );
  }

  // Sort policies by days until renewal (like your snippet)
  const sortedPolicies = [...policies].sort(
    (a, b) =>
      calculateDaysUntilRenewal(a.expiration_date) -
      calculateDaysUntilRenewal(b.expiration_date)
  );

  // Figure out the step index for the Domino's tracker
  const currentStep = leadSteps.indexOf(leadStage);

  return (
    <Container sx={{ marginTop: '16px' }}>
      {alertMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setAlertMsg('')}
        >
          {alertMsg}
        </Alert>
      )}

      {/* 1) Customer & Policy Data in TABLES (Excel Style) */}
      <Paper sx={darkPaperStyle}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Customer & Policy Overview
        </Typography>

        {/* Single Customer Row Table */}
        <TableContainer sx={{ ...darkTableStyle, mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>State</strong></TableCell>
                <TableCell><strong>DOB</strong></TableCell>
                <TableCell><strong>Customer Since</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {customer.first_name} {customer.last_name}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{formatPhone(customer.phone)}</TableCell>
                <TableCell>
                  {customer.address}, {customer.city} {customer.zipcode}
                </TableCell>
                <TableCell>{(customer.state || '').toUpperCase()}</TableCell>
                <TableCell>
                  {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'N/A'}
                </TableCell>
                <TableCell>
                  {customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Policies Table */}
        <TableContainer sx={darkTableStyle}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Policy Type</strong></TableCell>
                <TableCell><strong>Policy #</strong></TableCell>
                <TableCell align="center"><strong>RISK</strong></TableCell>
                <TableCell><strong>Effective</strong></TableCell>
                <TableCell><strong>Expiration</strong></TableCell>
                <TableCell align="center"><strong>Days Until Renewal</strong></TableCell>
                <TableCell><strong>Docs</strong></TableCell>
                <TableCell align="center"><strong>Premium</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No policies found for this customer.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPolicies.map((policy) => {
                  const hazardIcons = getHazardIcons(customer.state);
                  const daysLeft = calculateDaysUntilRenewal(policy.expiration_date);
                  return (
                    <TableRow key={policy.policy_id} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {policy.policy_type.toUpperCase()}
                      </TableCell>
                      <TableCell>{policy.policy_number}</TableCell>
                      <TableCell align="center">
                        {hazardIcons.length ? (
                          <Box display="flex" justifyContent="center">
                            {hazardIcons}
                          </Box>
                        ) : (
                          'None'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(policy.effective_date)}</TableCell>
                      <TableCell>{formatDate(policy.expiration_date)}</TableCell>
                      <TableCell align="center" sx={{ color: 'red', fontWeight: 'bold' }}>
                        {daysLeft}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Download Policy PDF">
                          <IconButton
                            onClick={() => handleDownloadPolicyDoc(policy, customer)}
                            size="small"
                            sx={{ color: '#fff' }}
                          >
                            <PictureAsPdfIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        ${policy.premium}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 2) Opportunity Tracking: Domino's Pizza Tracker */}
      <Paper sx={darkPaperStyle}>
        <Typography variant="h5" sx={sectionTitleStyle}>
          Lead / Opportunity Tracking
        </Typography>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Stepper
            activeStep={currentStep >= 0 ? currentStep : 0}
            alternativeLabel
            sx={{ color: '#fff' }}
          >
            {leadSteps.map((label) => (
              <Step
                key={label}
                onClick={() => handleChangeLeadStage(label)}
                sx={{ cursor: 'pointer' }}
              >
                <StepLabel
                  sx={{
                    '.MuiStepLabel-label': { color: '#fff' },
                    '.Mui-completed .MuiStepLabel-label': { color: '#fff' }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Typography>
          Current Stage: <strong>{leadStage}</strong>
        </Typography>
      </Paper>

      {/* 3) Life Events / Milestones */}
      <Paper sx={darkPaperStyle}>
        <Typography variant="h5" sx={sectionTitleStyle}>
          Life Events & Milestones
        </Typography>
        {lifeEvents.length === 0 ? (
          <Typography>No life events recorded yet.</Typography>
        ) : (
          lifeEvents.map((evt, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {evt.title}
              </Typography>
              <Typography variant="body2">
                Date: {formatDate(evt.date)}
              </Typography>
              <Divider sx={{ my: 1, borderColor: '#555' }} />
            </Box>
          ))
        )}
        <Button
          variant="contained"
          sx={{ mt: 1 }}
          onClick={handleAddLifeEvent}
          startIcon={<AutoFixHighIcon />}
        >
          Add Example Life Event
        </Button>
      </Paper>

      {/* 4) Notes & Interactions */}
      <Paper sx={darkPaperStyle}>
        <Typography variant="h5" sx={sectionTitleStyle}>
          Notes & Interactions
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Jot down calls, emails, or important details (time-stamp them in real usage).
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter notes here..."
          sx={{
            backgroundColor: '#3a3b40',
            borderRadius: '4px',
            mb: 2,
            color: '#FFFFFF'
          }}
          InputProps={{
            style: { color: '#FFFFFF' }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSaveNotes}
          startIcon={<MonetizationOnIcon />}
        >
          Save Notes
        </Button>
      </Paper>

      {/* 5) Marketing Campaigns */}
      <Paper sx={darkPaperStyle}>
        <Typography variant="h5" sx={sectionTitleStyle}>
          Marketing Campaigns
        </Typography>
        {campaigns.map((c, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>{c.name}</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="#ddd">
                {c.active ? 'Active' : 'Inactive'}
              </Typography>
              <Button
                variant="contained"
                color={c.active ? 'error' : 'success'}
                onClick={() => toggleCampaign(idx)}
              >
                {c.active ? 'Disable' : 'Enable'}
              </Button>
            </Box>
          </Box>
        ))}
        <Divider sx={{ my: 2, borderColor: '#555' }} />
        <Typography variant="body2">
          (Demo) Toggle campaigns or add new ones for birthdays, renewals, cross-sell triggers, etc.
        </Typography>
      </Paper>

      <Box sx={{ height: 50 }} />
    </Container>
  );
};

export default CustomerDetailPage;
