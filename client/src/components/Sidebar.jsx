import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeProvider';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Switch, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <Drawer variant="permanent" sx={{ width: 250, flexShrink: 0 }}>
      <Toolbar>
        <Typography variant="h6">Insurance Hub</Typography>
      </Toolbar>
      <List>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate('/customers')}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Customers" />
        </ListItem>
        <ListItem button onClick={() => navigate('/policies')}>
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Policies" />
        </ListItem>
        <ListItem button onClick={() => navigate('/quoting')}>
          <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
          <ListItemText primary="Quoting" />
        </ListItem>
        <ListItem button onClick={() => navigate('/claims')}>
          <ListItemIcon><SentimentVeryDissatisfiedIcon /></ListItemIcon>
          <ListItemText primary="Claims" />
        </ListItem>
      </List>
      <ListItem>
        <ListItemText primary="Dark Mode" />
        <Switch checked={darkMode} onChange={toggleDarkMode} />
      </ListItem>
    </Drawer>
  );
};

export default Sidebar;
