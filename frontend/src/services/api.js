import axios from 'axios';
import { format } from 'date-fns';

// Configure Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle different error statuses
      switch (error.response.status) {
        case 401:
          // Handle unauthorized
          break;
        case 403:
          // Handle forbidden
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          // Handle other errors
          break;
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to format Nigerian currency
const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Shop Management
const getShops = async (page = 1, search = '', filters = {}) => {
  try {
    const response = await api.get('/shops', {
      params: { page, search, ...filters },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createShop = async (shopData) => {
  try {
    const response = await api.post('/shops', shopData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getShop = async (id) => {
  try {
    const response = await api.get(`/shops/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateShop = async (id, data) => {
  try {
    const response = await api.put(`/shops/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteShop = async (id) => {
  try {
    const response = await api.delete(`/shops/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getShopsByWard = async (ward) => {
  try {
    const response = await api.get('/shops/ward', { params: { ward } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Payment Management
const getPayments = async (filters = {}) => {
  try {
    const response = await api.get('/payments', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createPayment = async (paymentData) => {
  try {
    const response = await api.post('/payments', paymentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPayment = async (id) => {
  try {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getDailySummary = async () => {
  try {
    const response = await api.get('/payments/daily-summary');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getOverduePayments = async () => {
  try {
    const response = await api.get('/payments/overdue');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const calculateShopDues = async (shopId) => {
  try {
    const response = await api.get(`/payments/dues/${shopId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Permit Management
const getPermits = async (filters = {}) => {
  try {
    const response = await api.get('/permits', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createPermit = async (permitData) => {
  try {
    const response = await api.post('/permits', permitData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const renewPermit = async (permitId) => {
  try {
    const response = await api.put(`/permits/${permitId}/renew`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getExpiringPermits = async (days = 30) => {
  try {
    const response = await api.get('/permits/expiring', { params: { days } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reporting
const getDashboardStats = async () => {
  try {
    const response = await api.get('/reports/dashboard');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getRevenueChart = async (period = 'monthly') => {
  try {
    const response = await api.get('/reports/revenue', { params: { period } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getComplianceReport = async () => {
  try {
    const response = await api.get('/reports/compliance');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getBusinessTypeAnalysis = async () => {
  try {
    const response = await api.get('/reports/business-types');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  // Shop Management
  getShops,
  createShop,
  getShop,
  updateShop,
  deleteShop,
  getShopsByWard,
  
  // Payment Management
  getPayments,
  createPayment,
  getPayment,
  getDailySummary,
  getOverduePayments,
  calculateShopDues,
  
  // Permit Management
  getPermits,
  createPermit,
  renewPermit,
  getExpiringPermits,
  
  // Reporting
  getDashboardStats,
  getRevenueChart,
  getComplianceReport,
  getBusinessTypeAnalysis,
  
  // Helpers
  formatNaira,
};