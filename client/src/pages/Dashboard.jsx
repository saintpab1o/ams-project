import React, { useState, useEffect } from 'react';
import { getCustomers, getPolicies } from '../services/api';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Box
} from '@mui/material';

// Icons
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TornadoSharpIcon from '@mui/icons-material/TornadoSharp';

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

      const totalPrem = policies.reduce((sum, pol) => sum + Number(pol.premium || 0), 0);
      setTotalPremium(totalPrem);

      // Expiring Soon (30 days)
      const today = new Date();
      const soonCount = policies.filter((pol) => {
        const expDate = new Date(pol.expiration_date);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }).length;
      setExpiringSoon(soonCount);

      // Average Premium & Revenue Forecast
      const avgPrem = policies.length > 0 ? (totalPrem / policies.length).toFixed(2) : 0;
      setAveragePremium(avgPrem);

      const revForecast = policies.length > 0 ? (totalPrem * 1.1).toFixed(2) : 0;
      setRevenueForecast(revForecast);

      // Map each policy -> state
      const customerStateMap = customers.reduce((acc, c) => {
        acc[c.customer_id] = c.state;
        return acc;
      }, {});

      // Sum premium by state
      const statePremiums = {};
      for (const pol of policies) {
        const st = customerStateMap[pol.customer_id];
        if (!st) continue;

        if (!statePremiums[st]) {
          statePremiums[st] = { totalPremium: 0, policyCount: 0 };
        }
        statePremiums[st].totalPremium += Number(pol.premium || 0);
        statePremiums[st].policyCount += 1;
      }

      // Sort top 5
      const allStatesArray = Object.entries(statePremiums).map(([st, info]) => ({
        state: st,
        totalPremium: info.totalPremium,
        policyCount: info.policyCount
      }));
      allStatesArray.sort((a, b) => b.totalPremium - a.totalPremium);

      const top5 = allStatesArray.slice(0, 5);
      const maxPremium = top5.length > 0 ? top5[0].totalPremium : 0;

      // Hazard sets
      const fireStates = new Set(['CA','NV', 'OR', 'OK', 'ID', 'TX', 'CO', 'UT']);
      const floodStates = new Set(['FL', 'TX', 'NC', 'LA', 'SC', 'AL', 'GA', 'MI', 'NY', 'MA']);
      const tornadoStates = new Set(['IL', 'AL', 'CO', 'TX', 'MI', 'NB', 'IA', 'GA', 'OH', 'TN']);

      const updatedTopStates = top5.map((item, idx) => {
        // base exposure 0..80
        let exposure = maxPremium ? (item.totalPremium / maxPremium) * 80 : 0;
        const icons = [];

        // Fire Hazard
        if (fireStates.has(item.state)) {
          exposure += 15;
          icons.push(<LocalFireDepartmentIcon key={`fire-${item.state}`} sx={{ marginRight: 1, color: 'red' }} />);
        }
        // Flood Hazard
        if (floodStates.has(item.state)) {
          exposure += 15;
          icons.push(<WaterDropIcon key={`water-${item.state}`} sx={{ marginRight: 1, color: 'blue' }} />);
        }
        // Tornado Hazard
        if (tornadoStates.has(item.state)) {
          exposure += 15;
          icons.push(<TornadoSharpIcon  key={`wind-${item.state}`} sx={{ marginRight: 1, color: 'gray' }} />);
        }

        return {
          ...item,
          exposure: Math.round(exposure),
          icons
        };
      });

      setTopStates(updatedTopStates);
    };

    fetchData();
  }, []);

  // Card style
  const cardStyle = {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#2D2F36',
    color: '#FFFFFF',
    borderRadius: '8px'
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Welcome, Paul!
      </Typography>
      <Divider sx={{ marginBottom: 3 }} />

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
            <Typography variant="h4">
              ${Number(revenueForecast).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Top 5 States by Premium with Hazards */}
        <Grid item xs={12}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" align="center" gutterBottom>
              Top 5 States by Total Premium
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Rank</strong></TableCell>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell><strong>Policy Count</strong></TableCell>
                    <TableCell><strong>Total Premium</strong></TableCell>
                    <TableCell><strong>Exposure</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topStates.length > 0 ? (
                    topStates.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.state}</TableCell>
                        <TableCell>{item.policyCount}</TableCell>
                        <TableCell>${item.totalPremium.toLocaleString()}</TableCell>
                        <TableCell>{item.exposure}</TableCell>
                        <TableCell><Box display="flex" alignItems="center">{item.icons}</Box></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No data available
                      </TableCell>
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
