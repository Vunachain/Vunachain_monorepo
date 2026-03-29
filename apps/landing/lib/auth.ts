import { jwtDecode } from 'jwt-decode';

export type UserRole = 'CoopManager' | 'FieldAgent' | 'Agronomist' | 'Offtaker' | 'Auditor' | 'CaseOfficer' | 'Staff' | 'User';

export interface JWTPayload {
    token_type: string;
    exp: number;
    iat: number;
    jti: string;
    user_id: number;
    username: string;
    email: string;
    roles: string[];
    primary_role: UserRole;
}

const TOKEN_KEY = 'vunachain_token';
const REFRESH_KEY = 'vunachain_refresh';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

export function decodeToken(): JWTPayload | null {
    const token = getToken();
    if (!token) return null;
    try {
        const decoded = jwtDecode<JWTPayload>(token);
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
            clearTokens();
            return null;
        }
        return decoded;
    } catch {
        clearTokens();
        return null;
    }
}

export function isAuthenticated(): boolean {
    return decodeToken() !== null;
}

export function getUserRole(): UserRole {
    const payload = decodeToken();
    return payload?.primary_role ?? 'User';
}

export function getUserName(): string {
    const payload = decodeToken();
    return payload?.username ?? '';
}

/**
 * Returns the default dashboard path for a given role.
 */
export function getRoleDashboardPath(role: UserRole): string {
    switch (role) {
        case 'CoopManager':
            return '/dashboard/coop';
        case 'FieldAgent':
            return '/dashboard/field';
        case 'Agronomist':
            return '/dashboard/agro';
        case 'Offtaker':
            return '/dashboard/offtaker';
        case 'Auditor':
            return '/dashboard/audit';
        case 'CaseOfficer':
            return '/dashboard/case';
        case 'Staff':
            return '/dashboard';
        default:
            return '/dashboard';
    }
}
