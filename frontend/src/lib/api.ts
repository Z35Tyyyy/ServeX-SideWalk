import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use((res) => res, (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/tables/')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

export default api;

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Tables
export const getTable = (id: string) => api.get(`/tables/${id}`);
export const getTables = () => api.get('/tables');
export const createTable = (data: { tableNumber: number; capacity?: number }) => api.post('/tables', data);
export const updateTable = (id: string, data: Record<string, unknown>) => api.patch(`/tables/${id}`, data);
export const deleteTable = (id: string) => api.delete(`/tables/${id}`);
export const regenerateQR = (id: string) => api.post(`/tables/${id}/regenerate-qr`);

// Menu
export const getMenu = (category?: string) => api.get('/menu', { params: { category } });
export const getMenuCategories = () => api.get('/menu/categories');
export const createMenuItem = (data: Record<string, unknown>) => api.post('/menu', data);
export const updateMenuItem = (id: string, data: Record<string, unknown>) => api.patch(`/menu/${id}`, data);
export const deleteMenuItem = (id: string) => api.delete(`/menu/${id}`);
export const toggleAvailability = (id: string) => api.patch(`/menu/${id}/availability`);

// Orders - now includes sessionToken
export const createOrder = (data: {
    tableId: string;
    items: Array<{ menuItemId: string; quantity: number; specialInstructions?: string }>;
    sessionToken: string;
}) => api.post('/orders', data);

export const getOrder = (id: string) => api.get(`/orders/${id}`);
export const getKitchenOrders = () => api.get('/orders/kitchen/active');
export const updateOrderStatus = (id: string, status: string) => api.patch(`/orders/${id}/status`, { status });
export const getAllOrders = (params?: { page?: number; limit?: number; status?: string }) => api.get('/orders', { params });
export const getAnalytics = () => api.get('/orders/analytics/summary');

// Payments
export const createPayment = (orderId: string) => api.post('/payments/create', { orderId });
export const verifyPayment = (data: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => api.post('/payments/verify', data);
export const confirmCashPayment = (orderId: string) => api.post('/payments/cash', { orderId });
