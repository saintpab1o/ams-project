import React, { useState, useEffect } from 'react';
import { getCustomers, getPolicies } from '../services/api';
import { Container, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';

const Dashboard = () => {
  const [customerCount, setCustomerCount] = useState(0);
  const [policyCount, setPolicyCount] = useState(0);
  const [totalPremium, setTotalPremium] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [averagePremium, setAveragePremium] = useState(0);
  const [revenueForecast, setRevenueForecast] = useState(0);
  const [topStates, setTopStates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const customers = await getCustomers();
      const policies = await getPolicies();

      setCustomerCount(customers.length);
      setPolicyCount(policies.length);
      const totalPremiumValue = policies.reduce((sum, policy) => sum + Number(policy.premium || 0), 0);
      setTotalPremium(totalPremiumValue);

      // Calculate Policies Expiring in Next 30 Days
      const today = new Date();
      const expiringSoonCount = policies.filter((policy) => {
        const expDate = new Date(policy.expiration_date);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length;
      setExpiringSoon(expiringSoonCount);

      // Fix Calculations for Average Premium & Revenue Forecast
      setAveragePremium(policies.length > 0 ? (totalPremiumValue / policies.length).toFixed(2) : 0);
      setRevenueForecast(policies.length > 0 ? (totalPremiumValue * 1.1).toFixed(2) : 0);

      // Get Top 3 States with Most Policies
      const stateCounts = customers.reduce((acc, customer) => {
        acc[customer.state] = (acc[customer.state] || 0) + 1;
        return acc;
      }, {});

      const sortedStates = Object.entries(stateCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by policy count
        .slice(0, 3) // Get top 3
        .map(([state, count]) => ({ state, count }));

      setTopStates(sortedStates);
    };

    fetchData();
  }, []);

  // Apply the same background color as the original "Total Customers" and "Total Premium" boxes
  const cardStyle = {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#2D2F36', // Dark gray, works in both light and dark mode
    color: '#FFFFFF',
    borderRadius: '8px',
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Divider style={{ marginBottom: '20px' }} />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Total Customers</Typography>
            <Typography variant="h4">{customerCount}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Total Policies</Typography>
            <Typography variant="h4">{policyCount}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Total Premium ($)</Typography>
            <Typography variant="h4">${totalPremium.toLocaleString()}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Expiring in Next 30 Days</Typography>
            <Typography variant="h4">{expiringSoon}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Avg. Policy Premium</Typography>
            <Typography variant="h4">${averagePremium}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={cardStyle}>
            <Typography variant="h6">Revenue Forecast (Next Year)</Typography>
            <Typography variant="h4">${revenueForecast.toLocaleString()}</Typography>
          </Paper>
        </Grid>

        {/* Top 3 States Table */}
        <Grid item xs={12}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" align="center">Top 3 States with Most Policies</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell><strong>Number of Policies</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topStates.length > 0 ? (
                    topStates.map((state, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{state.state}</TableCell>
                        <TableCell>{state.count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
