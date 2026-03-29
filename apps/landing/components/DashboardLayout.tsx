import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearTokens, getUserName, getUserRole, UserRole } from '../lib/auth';

interface NavLink {
    icon: string;
    label: string;
    path: string;
}

const getLinksForRole = (role: UserRole): NavLink[] => {
    switch (role) {
        case 'CoopManager':
            return [
                { icon: 'dashboard', label: 'Overview', path: '/dashboard/coop' },
                { icon: 'groups', label: 'My Farmers', path: '/dashboard/coop/farmers' },
                { icon: 'agriculture', label: 'Harvest Logs', path: '/dashboard/coop/harvests' },
                { icon: 'description', label: 'Supply Contracts', path: '/dashboard/coop/contracts' },
                { icon: 'payments', label: 'Payout Status', path: '/dashboard/coop/payouts' },
            ];
        case 'FieldAgent':
            return [
                { icon: 'checklist', label: 'Review Queue', path: '/dashboard/field' },
                { icon: 'person_add', label: 'Farmer Onboarding', path: '/dashboard/field/onboarding' },
                { icon: 'add_circle', label: 'New Collection', path: '/dashboard/field/log' },
            ];
        case 'Agronomist':
            return [
                { icon: 'analytics', label: 'Plot Overview', path: '/dashboard/agro' },
                { icon: 'verified_user', label: 'Verification Queue', path: '/dashboard/agro/verification' },
                { icon: 'insights', label: 'Yield Forecasting', path: '/dashboard/agro/forecasting' },
                { icon: 'map', label: 'Geospatial Map', path: '/dashboard/agro/map' },
                { icon: 'monitoring', label: 'Activity Logs', path: '/dashboard/agro/logs' },
            ];
        case 'Offtaker':
            return [
                { icon: 'verified_user', label: 'Compliance Portal', path: '/dashboard/offtaker' },
                { icon: 'add_shopping_cart', label: 'Post Buyer Need', path: '/dashboard/offtaker/needs' },
                { icon: 'inventory_2', label: 'Purchase History', path: '/dashboard/offtaker/history' },
            ];
        case 'Auditor':
            return [
                { icon: 'dashboard', label: 'Overview', path: '/dashboard/audit' },
                { icon: 'groups', label: 'Farmer Directory', path: '/dashboard/audit/farmers' },
                { icon: 'map', label: 'Plot Map', path: '/dashboard/audit/plots' },
                { icon: 'agriculture', label: 'Harvest Registry', path: '/dashboard/audit/harvests' },
                { icon: 'verified_user', label: 'Compliance Audit', path: '/dashboard/audit/compliance' },
                { icon: 'photo_camera', label: 'Field Evidence', path: '/dashboard/audit/field_events' },
                { icon: 'monitoring', label: 'System Status', path: '/dashboard/audit/system' },
                { icon: 'manage_accounts', label: 'User Management', path: '/dashboard/audit/users' },
            ];
        case 'CaseOfficer':
            return [
                { icon: 'gavel', label: 'Market Oversight', path: '/dashboard/case' },
                { icon: 'description', label: 'All Contracts', path: '/dashboard/case/contracts' },
                { icon: 'hub', label: 'Network Health', path: '/dashboard/case/health' },
                { icon: 'credit_score', label: 'Credit Management', path: '/dashboard/case/credit' },
            ];
        default:
            return [
                { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
            ];
    }
};

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const role = getUserRole();
    const username = getUserName();
    const links = getLinksForRole(role);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleLogout = () => {
        clearTokens();
        navigate('/login');
    };

    const isActive = (link: NavLink) => {
        const currentPath = location.pathname + location.search;
        // Exact match for base paths, includes match for query params
        if (link.path.includes('?')) {
            return currentPath === link.path;
        }
        return location.pathname === link.path;
    };

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden font-sans">
            {/* TopNavBar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-3 bg-white dark:bg-gray-900 fixed top-0 left-0 right-0 z-30 transition-colors">
                <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                    <div className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary">
                        <img src="/logo.png" alt="Vunachain Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Vunachain</h2>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden md:flex p-1.5 ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-slate-400"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {sidebarCollapsed ? 'menu' : 'menu'}
                        </span>
                    </button>
                    {/* Mobile toggle */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="md:hidden flex p-1.5 ml-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-slate-400"
                    >
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                    </button>
                </div>
                
                <div className="hidden md:flex flex-1 justify-end gap-2 md:gap-4 items-center">
                    <label className="flex flex-col min-w-40 !h-10 max-w-sm w-full md:w-auto">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                            <div className="text-slate-400 dark:text-gray-500 flex border-none bg-gray-100 dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-gray-100 dark:bg-gray-800 focus:border-none h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-sm font-medium leading-normal" placeholder="Search..." value="" onChange={()=>{}}/>
                        </div>
                    </label>
                    <div className="flex gap-2">
                        <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </button>
                        <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">help_outline</span>
                        </button>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                        {username ? username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col ml-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{username || 'User'}</span>
                        <span className="text-[11px] text-slate-500 font-medium capitalize">{role.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                </div>
            </header>

            <div className="flex h-full w-full pt-[64px]">
                {/* SideNavBar */}
                <aside className={`fixed top-[64px] bottom-0 left-0 h-[calc(100vh-64px)] flex-col justify-between bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-20 transition-all duration-300 md:flex ${sidebarCollapsed ? 'w-0 md:w-20 overflow-hidden' : 'w-64'} ${!sidebarCollapsed ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex flex-col gap-4 p-4 overflow-y-auto overflow-x-hidden scrollbar-hide flex-1">
                        <div className="flex flex-col gap-1 mt-2">
                            {links.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => navigate(link.path)}
                                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                                        isActive(link)
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                                    }`}
                                    title={sidebarCollapsed ? link.label : undefined}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[22px] transition-transform duration-200 ${
                                            isActive(link) ? 'scale-110' : 'group-hover:scale-105'
                                        }`}
                                        style={{ fontVariationSettings: isActive(link) ? "'FILL' 1" : "'FILL' 0" }}
                                    >
                                        {link.icon}
                                    </span>
                                    {!sidebarCollapsed && (
                                        <span className="whitespace-nowrap flex-1 text-left">{link.label}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
                        >
                            <span className="material-symbols-outlined text-[22px] transition-transform duration-200">logout</span>
                            {!sidebarCollapsed && <span className="whitespace-nowrap">Log out</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 transition-all duration-300 min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 ${sidebarCollapsed ? 'md:ml-20 ml-0' : 'md:ml-64 ml-0'}`}>
                    <div className="w-full max-w-7xl mx-auto h-full animate-fade-in relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
