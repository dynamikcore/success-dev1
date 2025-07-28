const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Shop API functions
export const createShop = async (shopData) => {
  return apiRequest('/shops', {
    method: 'POST',
    body: shopData,
  });
};

export const fetchShops = async (query = '', page = 1, limit = 10) => {
  try {
    if (query && query.length >= 2) {
      // Use search endpoint for autocomplete
      const params = new URLSearchParams({ q: query });
      const response = await apiRequest(`/shops/search?${params.toString()}`);
      console.log('Shop search response:', response); // Debug log
      return response;
    } else {
      // Use regular listing endpoint
      const params = new URLSearchParams({ page, limit });
      const response = await apiRequest(`/shops?${params.toString()}`);
      console.log('Shop list response:', response); // Debug log
      return response;
    }
  } catch (error) {
    console.error('Error fetching shops:', error);
    return { shops: [] };
  }
};

export const getShopById = async (shopId) => {
  return apiRequest(`/shops/${shopId}`);
};

export const updateShop = async (shopId, shopData) => {
  return apiRequest(`/shops/${shopId}`, {
    method: 'PUT',
    body: shopData,
  });
};

export const deleteShop = async (shopId) => {
  return apiRequest(`/shops/${shopId}`, {
    method: 'DELETE',
  });
};

// Payment API functions
export const createPayment = async (paymentData) => {
  return apiRequest('/payments', {
    method: 'POST',
    body: paymentData,
  });
};

export const fetchPayments = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/payments?${params}` : '/payments';
  return apiRequest(endpoint);
};

export const getPaymentById = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}`);
};

// Permit API functions
export const createPermit = async (permitData) => {
  return apiRequest('/permits', {
    method: 'POST',
    body: permitData,
  });
};

export const fetchPermits = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const endpoint = params ? `/permits?${params}` : '/permits';
  return apiRequest(endpoint);
};

export const getPermitById = async (permitId) => {
  return apiRequest(`/permits/${permitId}`);
};

export const renewPermit = async (permitIds) => {
  // Handle both single ID and array of IDs
  const ids = Array.isArray(permitIds) ? permitIds : [permitIds];
  return apiRequest('/permits/renew', {
    method: 'POST',
    body: { permitIds: ids },
  });
};

export const sendReminder = async (permitIds) => {
  const ids = Array.isArray(permitIds) ? permitIds : [permitIds];
  return apiRequest('/permits/send-reminder', {
    method: 'POST',
    body: { permitIds: ids },
  });
};

// Revenue Type API functions
export const fetchRevenueTypes = async () => {
  try {
    const response = await apiRequest('/revenue-types');
    console.log('API response for revenue types:', response); // Debug log

    // Return the array directly, ensuring consistent format
    if (Array.isArray(response)) {
      return response;
    } else if (response && Array.isArray(response.data)) {
      return response.data;
    } else if (response && Array.isArray(response.revenueTypes)) {
      return response.revenueTypes;
    } else {
      console.warn('Unexpected revenue types response format:', response);
      return [];
    }
  } catch (error) {
    console.error('Error fetching revenue types:', error);
    return [];
  }
};

export const createRevenueType = async (revenueTypeData) => {
  return apiRequest('/revenue-types', {
    method: 'POST',
    body: revenueTypeData,
  });
};

// Dashboard API functions
export const fetchDashboardStats = async () => {
  try {
    const response = await apiRequest('/dashboard/stats');
    return response;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalShops: 0,
      todayRevenue: 0,
      pendingRenewals: 0,
      complianceRate: 0
    };
  }
};

export const fetchRecentRegistrations = async (limit = 5) => {
  try {
    const response = await apiRequest(`/shops/recent?limit=${limit}`);
    return response.shops || [];
  } catch (error) {
    console.error('Error fetching recent registrations:', error);
    return [];
  }
};

export const fetchRecentPayments = async (limit = 5) => {
  try {
    const response = await apiRequest(`/payments/recent?limit=${limit}`);
    return response.payments || [];
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    return [];
  }
};

export const fetchExpiringPermits = async (days = 30) => {
  try {
    const response = await apiRequest(`/permits/expiring?days=${days}`);
    return response.permits || [];
  } catch (error) {
    console.error('Error fetching expiring permits:', error);
    return [];
  }
};

// Utility functions
export const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};