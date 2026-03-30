import axios from 'axios';
import { 
    Farmer, Plot, Harvest, FarmEvent, 
    SystemHealth, AdminUser 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authApi = {
    login: (credentials: Record<string, string>) => api.post('/token/', credentials),
    refresh: (refresh: string) => api.post('/token/refresh/', { refresh }),
};

// --- Interceptors ---
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
    list: () => api.get<Farmer[]>('/farmers/'),
    get: (id: string) => api.get<Farmer>(`/farmers/${id}/`),
    create: (data: Partial<Farmer>) => api.post<Farmer>('/farmers/', data),
    patch: (id: string, data: Partial<Farmer>) => api.patch<Farmer>(`/farmers/${id}/`, data),
    updateWallet: (id: string, data: { celo_address: string }) => api.patch<{ success: boolean }>(`/farmers/${id}/wallet/`, data),
};

export const plotApi = {
    list: () => api.get<Plot[]>('/plots/'),
    get: (id: string) => api.get<Plot>(`/plots/${id}/`),
    create: (data: Partial<Plot>) => api.post<Plot>('/plots/', data),
    patch: (id: string, data: Partial<Plot>) => api.patch<Plot>(`/plots/${id}/`, data),
    approve: (id: string) => api.post<{ success: boolean }>(`/plots/${id}/approve/`),
    getCompliance: (id: string) => api.get(`/plots/${id}/compliance/`),
};

export const harvestApi = {
    list: () => api.get<Harvest[]>('/harvests/history/'),
    create: (data: Partial<Harvest>) => api.post<Harvest>('/harvests/', data),
    getTrace: (batchId: string) => api.get(`/harvests/trace/${batchId}/`),
};

export const complianceApi = {
    getSummary: () => api.get<{ total_plots: number, compliant_count: number, compliance_rate: number }>('/compliance/summary/'),
    getCertificate: (plotId: string) => api.get(`/compliance/${plotId}/certificate/`, { responseType: 'blob' }),
};

export const farmEventApi = {
    list: () => api.get<FarmEvent[]>('/farm_events/'),
    create: (data: Partial<FarmEvent>) => api.post<FarmEvent>('/farm_events/', data),
};

export const contractApi = {
    list: (params?: Record<string, string | number>) => api.get('/contracts/', { params }),
    get: (id: string) => api.get(`/contracts/${id}/`),
    create: (data: any) => api.post('/contracts/', data),
    accept: (id: string) => api.post<{ success: boolean }>(`/contracts/${id}/accept/`),
};

export const analyticsApi = {
    getMetrics: () => api.get('/analytics/'),
};

export const adminApi = {
    getHealth: () => api.get<SystemHealth>('/admin/system/'),
    getUsers: () => api.get<AdminUser[]>('/admin/users/'),
    updateUser: (id: number, data: Partial<AdminUser>) => api.patch<AdminUser>(`/admin/users/${id}/`, data),
    deactivateUser: (id: number) => api.delete<{ success: boolean }>(`/admin/users/${id}/`),
};

export const payoutApi = {
    list: () => api.get('/payouts/'),
};

export default api;
