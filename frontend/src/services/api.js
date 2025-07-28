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
  const params = new URLSearchParams({ page, limit });
  if (query) params.append('search', query);
  return apiRequest(`/shops?${params.toString()}`);
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

// Revenue Type API functions
export const fetchRevenueTypes = async () => {
  return apiRequest('/revenue-types');
};

export const createRevenueType = async (revenueTypeData) => {
  return apiRequest('/revenue-types', {
    method: 'POST',
    body: revenueTypeData,
  });
};

// Utility functions
export const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};