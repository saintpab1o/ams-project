import React, { useState, useEffect } from 'react';
import { getPolicies, deletePolicy } from '../services/api';
import { Grid, Card, CardContent, IconButton, Container, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

const PoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await getPolicies();

        // Sort policies by days until renewal (soonest first)
        const sortedPolicies = data.sort((a, b) => 
          calculateDaysUntilRenewal(a.expiration_date) - calculateDaysUntilRenewal(b.expiration_date)
        );

        setPolicies(sortedPolicies);
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };
    fetchPolicies();
  }, []);

  const handleDeletePolicy = async (policyId) => {
    try {
      await deletePolicy(policyId);
      setPolicies((prev) => prev.filter((policy) => policy.policy_id !== policyId));
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0]; // Formats as YYYY-MM-DD
  };

  const calculateDaysUntilRenewal = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const timeDiff = expDate - today;
    return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))); // Convert to days
  };

  // Get top 10 policies closest to renewal
  const suggestedOutreach = policies.slice(0, 5);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Policies</Typography>
      <Divider style={{ marginBottom: '20px' }} />

      {/* Suggested Outreach Section - Now in Table Format */}
      <Typography variant="h5" style={{ marginBottom: '10px' }}>Suggested Outreach</Typography>
      <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Policy #</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Premium ($)</strong></TableCell>
              <TableCell><strong>Expiration Date</strong></TableCell>
              <TableCell style={{ color: 'red' }}><strong>Days Until Renewal</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {suggestedOutreach.map((policy) => (
    <TableRow 
      key={policy.policy_id} 
      style={{ cursor: 'pointer' }} 
      onClick={() => navigate(`/customers/${policy.customer_id}`)}
    >
      <TableCell>{policy.policy_number}</TableCell>
      <TableCell>{policy.policy_type}</TableCell>
      <TableCell>${policy.premium}</TableCell>
      <TableCell>{formatDate(policy.expiration_date)}</TableCell>
      <TableCell style={{ color: 'red', fontWeight: 'bold' }}>{calculateDaysUntilRenewal(policy.expiration_date)}</TableCell>
    </TableRow>
  ))}
</TableBody>

        </Table>
      </TableContainer>

      {/* Full Policy List */}
      <Grid container spacing={2}>
        {policies.map((policy) => (
          <Grid item xs={12} sm={6} md={4} key={policy.policy_id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                  {policy.policy_type.toUpperCase()} - {policy.policy_number}
                </Typography>
                <Typography>💲 Premium: <strong>${policy.premium}</strong></Typography>
                <Typography>📅 Effective: {formatDate(policy.effective_date)}</Typography>
                <Typography>📅 Expiration: {formatDate(policy.expiration_date)}</Typography>
                <Typography variant="subtitle2" style={{ color: 'red', fontWeight: 'bold' }}>
                  🕒 Days Until Renewal: {calculateDaysUntilRenewal(policy.expiration_date)}
                </Typography>
                <IconButton onClick={() => handleDeletePolicy(policy.policy_id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PoliciesPage;
