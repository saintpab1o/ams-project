import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ----- Customer Endpoints -----
export const getCustomers = async () => {
  try {
    const response = await api.get('/api/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/api/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/api/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    await api.delete(`/api/customers/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting customer ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// ----- Policy Endpoints -----
export const getPolicies = async () => {
  try {
    const response = await api.get('/api/policies');
    return response.data;
  } catch (error) {
    console.error('Error fetching policies:', error.response?.data || error.message);
    throw error;
  }
};

export const createPolicy = async (policyData) => {
  try {
    const response = await api.post('/api/policies', policyData);
    return response.data;
  } catch (error) {
    console.error('Error creating policy:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePolicy = async (id, policyData) => {
  try {
    const response = await api.put(`/api/policies/${id}`, policyData);
    return response.data;
  } catch (error) {
    console.error(`Error updating policy ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deletePolicy = async (id) => {
  try {
    await api.delete(`/api/policies/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting policy ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getPoliciesByCustomer = async (customerId) => {
  try {
    const response = await api.get(`/api/policies/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching policies for customer ${customerId}:`, error.response?.data || error.message);
    throw error;
  }
};

export default api;
