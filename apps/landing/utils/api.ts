/**
 * API Utility for connecting to Django Backend
 */

export const isProduction = typeof window !== 'undefined' &&
    (window.location.hostname === 'vunachain.com' || window.location.hostname === 'www.vunachain.com');

const API_BASE_URL = isProduction
    ? 'https://vunachainbackend-production.up.railway.app/api'
    : 'http://localhost:8000/api';

interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

interface DemoRequestData {
    name: string;
    email: string;
    company: string;
    interest: string;
    location_point?: string; // Format: "POINT(longitude latitude)"
}

interface SubscriptionData {
    email: string;
    source?: string;
}

interface ROIInteractionData {
    input_volume: number;
    calculated_loss: number;
    crop_type: string;
    session_id?: string;
}

/**
 * Generic POST request handler
 */
async function post<T>(endpoint: string, data: unknown): Promise<APIResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Handle Django validation errors
            const errorMessage = Object.values(responseData).flat().join(', ') || 'An error occurred';
            return { success: false, error: errorMessage };
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: 'Network error. Please try again later.' };
    }
}

export const api = {
    leads: {
        createDemoRequest: (data: DemoRequestData) => post('/leads/demo-request/', data),
        subscribe: (data: SubscriptionData) => post('/leads/subscribe/', data),
    },
    analytics: {
        logROIInteraction: (data: ROIInteractionData) => post('/analytics/roi-interaction/', data),
    },
};
