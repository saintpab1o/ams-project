import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Agency Management System
        </Typography>
        <Button color="inherit" component={Link} to="/">Customers</Button>
        <Button color="inherit" component={Link} to="/policies">Policies</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;