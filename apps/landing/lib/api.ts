import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    login: (credentials: any) => api.post('/token/', credentials),
    refresh: (refresh: string) => api.post('/token/refresh/', { refresh }),
};

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vunachain_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh JWT on 401 — retry the original request once with the new token
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue the request until refresh completes
                return new Promise((resolve) => {
                    refreshQueue.push((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refresh = localStorage.getItem('vunachain_refresh');
                if (!refresh) throw new Error('No refresh token');

                const { data } = await api.post('/token/refresh/', { refresh });
                const newAccess: string = data.access;

                localStorage.setItem('vunachain_token', newAccess);
                api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;

                // Flush queued requests
                refreshQueue.forEach((cb) => cb(newAccess));
                refreshQueue = [];

                return api(originalRequest);
            } catch {
                // Refresh failed — clear tokens and redirect to login
                localStorage.removeItem('vunachain_token');
                localStorage.removeItem('vunachain_refresh');
                refreshQueue = [];
                window.location.href = '/login';
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export const farmerApi = {
    list: () => api.get('/farmers/'),
    get: (id: string) => api.get(`/farmers/${id}/`),
    create: (data: any) => api.post('/farmers/', data),
    patch: (id: string, data: any) => api.patch(`/farmers/${id}/`, data),
    updateWallet: (id: string, data: any) => api.patch(`/farmers/${id}/wallet/`, data),
};

export const plotApi = {
    list: () => api.get('/plots/'),
    get: (id: string) => api.get(`/plots/${id}/`),
    create: (data: any) => api.post('/plots/', data),
    patch: (id: string, data: any) => api.patch(`/plots/${id}/`, data),
    approve: (id: string) => api.post(`/plots/${id}/approve/`),
    getCompliance: (id: string) => api.get(`/plots/${id}/compliance/`),
};

export const harvestApi = {
    list: () => api.get('/harvests/history/'),
    create: (data: any) => api.post('/harvests/', data),
    getTrace: (batchId: string) => api.get(`/harvests/trace/${batchId}/`),
};

export const complianceApi = {
    getSummary: () => api.get('/compliance/summary/'),
    getCertificate: (plotId: string) => api.get(`/compliance/${plotId}/certificate/`, { responseType: 'blob' }),
};

export const farmEventApi = {
    list: () => api.get('/farm_events/'),
    create: (data: any) => api.post('/farm_events/', data),
};

export const contractApi = {
    list: (params?: any) => api.get('/contracts/', { params }),
    get: (id: string) => api.get(`/contracts/${id}/`),
    create: (data: any) => api.post('/contracts/', data),
    accept: (id: string) => api.post(`/contracts/${id}/accept/`),
};

export const analyticsApi = {
    // DRF ViewSet list action resolves at the router base URL with trailing slash
    getMetrics: () => api.get('/analytics/'),
};

export default api;
