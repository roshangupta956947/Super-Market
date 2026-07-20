// frontend/js/api.js
// If the frontend is hosted separately from the backend (e.g. frontend on
// Netlify, backend on Render), set window.API_BASE_URL in index.html before
// this script loads. Otherwise it defaults to same-origin (normal setup).
const API_URL = (window.API_BASE_URL || window.location.origin) + '/api';

console.log('🔗 API URL:', API_URL);

// API Request Helper
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            // Use the server's actual error message when it provides one
            // (e.g. "Please enter a valid Indian phone number") instead of
            // a generic, unhelpful status-code message.
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Product API
const ProductAPI = {
    getProducts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return await apiRequest(`/products?${query}`);
    },
    
    getProductById: async (id) => {
        return await apiRequest(`/products/${id}`);
    },
    
    getCategories: async () => {
        return await apiRequest('/products/categories');
    },
    
    getFeaturedProducts: async (limit = 8) => {
        return await apiRequest(`/products/featured?limit=${limit}`);
    },
    
    searchProducts: async (query, params = {}) => {
        const searchParams = new URLSearchParams({ q: query, ...params }).toString();
        return await apiRequest(`/products/search?${searchParams}`);
    }
};

// Cart API
const CartAPI = {
    getCart: async () => {
        return await apiRequest('/cart');
    },
    addToCart: async (productId, quantity = 1) => {
        return await apiRequest('/cart/add', 'POST', { productId, quantity });
    },
    removeFromCart: async (productId) => {
        return await apiRequest(`/cart/remove/${productId}`, 'DELETE');
    },
    clearCart: async () => {
        return await apiRequest('/cart/clear', 'DELETE');
    }
};

// Order API
const OrderAPI = {
    createOrder: async (orderData) => {
        return await apiRequest('/orders', 'POST', orderData);
    },
    getOrders: async () => {
        return await apiRequest('/orders');
    }
};

// Auth API
const AuthAPI = {
    login: async (email, password) => {
        return await apiRequest('/auth/login', 'POST', { email, password });
    },
    register: async (userData) => {
        return await apiRequest('/auth/register', 'POST', userData);
    },
    getProfile: async () => {
        return await apiRequest('/auth/profile');
    },
    logout: async () => {
        return await apiRequest('/auth/logout', 'POST');
    }
};

// Payment API
const PaymentAPI = {
    getMethods: async () => {
        return await apiRequest('/payment/methods');
    },
    initiate: async (paymentData) => {
        return await apiRequest('/payment/initiate', 'POST', paymentData);
    },
    verify: async (verifyData) => {
        return await apiRequest('/payment/verify', 'POST', verifyData);
    }
};

// Export
window.API = {
    ProductAPI,
    CartAPI,
    OrderAPI,
    AuthAPI,
    PaymentAPI,
    apiRequest
};

console.log('✅ API.js loaded successfully');