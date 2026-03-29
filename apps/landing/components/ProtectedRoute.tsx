import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole, UserRole } from '../lib/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

/**
 * Route guard that redirects unauthenticated users to /login
 * and optionally restricts access to specific roles.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const role = getUserRole();
        if (!allowedRoles.includes(role) && role !== 'Staff') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
