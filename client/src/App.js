import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import PoliciesPage from './pages/PoliciesPage';
import Sidebar from './components/Sidebar';
import ThemeProvider from './theme/ThemeProvider';
import { Box } from '@mui/material';
import CustomerDetailPage from './pages/CustomerDetailPage';
import QuotingPage from './pages/Quoting';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/policies" element={<PoliciesPage />} />
              <Route path="/customers/:customerId" element={<CustomerDetailPage />} /> {/* Dynamic route */}
              <Route path="/quoting" element={<QuotingPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
