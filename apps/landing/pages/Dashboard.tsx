import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
    Users, ShieldCheck, Shield, Globe, AlertTriangle, Download, 
    Loader, MapPin, Activity, Cpu, Database, HardDrive, 
    Clock, RefreshCw, Loader2
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import EventLogForm from '../components/EventLogForm';
import { HealthMetricCard, UserTable } from '../components/AdminComponents';
import { farmerApi, plotApi, complianceApi, farmEventApi, adminApi, harvestApi } from '../lib/api';
import { Farmer, Plot, FarmEvent } from '../types';

const Dashboard: React.FC = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [summary, setSummary] = useState<{ total_plots: number, compliant_count: number, compliance_rate: number } | null>(null);
    const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([]);
    const [harvests, setHarvests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Admin States
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [isPollingHealth, setIsPollingHealth] = useState(false);
    const [userCategory, setUserCategory] = useState<'internal' | 'external'>('internal');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('vunachain_token');
        setIsAuthenticated(!!token);

        const fetchData = async () => {
            try {
                const [farmersRes, plotsRes, summaryRes, eventsRes, harvestsRes] = await Promise.all([
                    farmerApi.list(),
                    plotApi.list(),
                    complianceApi.getSummary(),
                    farmEventApi.list(),
                    harvestApi.list()
                ]);
                setFarmers(farmersRes.data.results || farmersRes.data || []);
                setPlots(plotsRes.data.results || plotsRes.data || []);
                setSummary(summaryRes.data);
                setFarmEvents(eventsRes.data.results || eventsRes.data || []);
                setHarvests(harvestsRes.data.results || harvestsRes.data || []);
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                if (err.response?.status === 401) {
                    setIsAuthenticated(false);
                    localStorage.removeItem('vunachain_token');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Specific effect for Admin views
    useEffect(() => {
        if (!isAuthenticated) return;

        if (location.pathname.includes('/system')) {
            fetchSystemHealth();
            const interval = setInterval(fetchSystemHealth, 30000); // 30s auto-refresh as approved
            return () => clearInterval(interval);
        } else if (location.pathname.includes('/users')) {
            fetchUsers();
        }
    }, [location.pathname, isAuthenticated]);

    const fetchSystemHealth = async () => {
        setIsPollingHealth(true);
        try {
            const res = await adminApi.getHealth();
            setSystemHealth(res.data);
        } catch (err) {
            console.error('Failed to fetch health metrics:', err);
        } finally {
            setIsPollingHealth(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await adminApi.getUsers();
            setUsersList(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const handleUpdateUser = async (id: number, data: any) => {
        try {
            await adminApi.updateUser(id, data);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user permissions.');
        }
    };

    const handleDeactivateUser = async (id: number) => {
        if (window.confirm('Are you sure you want to deactivate this account?')) {
            try {
                await adminApi.deactivateUser(id);
                fetchUsers();
            } catch (err) {
                alert('Failed to deactivate user.');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('vunachain_token');
        localStorage.removeItem('vunachain_refresh');
        window.location.reload();
    };

    const handleDownloadCertificate = async (plotId: string) => {
        setDownloadingCert(plotId);
        try {
            const response = await complianceApi.getCertificate(plotId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Vunachain_Compliance_${plotId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download certificate:', err);
            alert('Failed to generate certificate. Please try again.');
        } finally {
            setDownloadingCert(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Vunachain Dashboard</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {isAuthenticated ? 'Authorized Auditor Access' : 'Public "Passport" View (Restricted)'}
                    </p>
                </div>
                {isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-red-500/10 hover:text-red-500 border border-transparent rounded-lg text-sm font-bold transition-all"
                    >
                        Sign Out
                    </button>
                ) : (
                    <a
                        href="/login"
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-primary/20"
                    >
                        Auditor Login
                    </a>
                )}
            </div>

            <div className="flex flex-col gap-8">
                {/* Main Content Area — No longer has local sidebar as navigation is moved to main layout */}
                <div className="flex-grow">
                    <Routes>
                        <Route index element={
                            <div className="space-y-8 animate-fade-in">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Total Farmers</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{farmers.length}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Compliance Rate</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{summary?.compliance_rate.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Verified Harvests</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{harvests.filter((h: any) => h.status === 1 || h.status === 3).length}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Map Section */}
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Geospatial Compliance View</h2>
                                    <MapComponent plots={plots} />
                                </div>
                            </div>
                        } />

                        <Route path="farmers" element={
                            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Farmer Directory</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-gray-100 dark:border-gray-700 uppercase tracking-widest text-xs font-bold">
                                                <th className="pb-4 font-bold">Name</th>
                                                <th className="pb-4 font-bold">Wallet Address</th>
                                                <th className="pb-4 font-bold">Phone</th>
                                                <th className="pb-4 font-bold text-right">Credit Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {farmers.map(farmer => (
                                                <tr key={farmer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="py-4 font-bold text-slate-900 dark:text-white">{farmer.full_name || 'Restricted Profile'}</td>
                                                    <td className="py-4 text-slate-500 font-mono text-xs">{farmer.celo_address || '0x... (Private)'}</td>
                                                    <td className="py-4 text-slate-500">{farmer.phone_number || 'N/A'}</td>
                                                    <td className="py-4 text-right">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${farmer.credit_score > 700 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {farmer.credit_score || 'Locked'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        } />

                        <Route path="plots" element={
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Registry Plots</h2>
                                <MapComponent plots={plots} />
                            </div>
                        } />

                        <Route path="harvests" element={
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                                        On-Chain Harvest Registry
                                    </h2>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{harvests.length} Records</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Record ID</th>
                                                <th className="px-6 py-4">Farmer Address</th>
                                                <th className="px-6 py-4">Crop</th>
                                                <th className="px-6 py-4 text-right">Weight (kg)</th>
                                                <th className="px-6 py-4 text-right">Payout (cUSD)</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {harvests.length === 0 ? (
                                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">No harvests indexed yet.</td></tr>
                                            ) : harvests.map((h: any) => {
                                                const statusMap: Record<number, { label: string; color: string; icon: string }> = {
                                                    0: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: 'hourglass_empty' },
                                                    1: { label: 'Verified', color: 'bg-blue-100 text-blue-700', icon: 'verified' },
                                                    2: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: 'cancel' },
                                                    3: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: 'check_circle' },
                                                };
                                                const s = statusMap[h.status] || statusMap[0];
                                                return (
                                                    <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">#{h.record_id}</td>
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{h.farmer_address ? `${h.farmer_address.slice(0,6)}...${h.farmer_address.slice(-4)}` : '—'}</td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{h.crop_type}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{parseFloat(h.weight_kg).toFixed(0)}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">${parseFloat(h.payout_amount_cusd || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.color}`}>
                                                                <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(h.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        } />

                        <Route path="field_events" element={
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                                <div className="xl:col-span-1">
                                    <EventLogForm farmers={farmers} plots={plots} onSuccess={() => {
                                        farmEventApi.list().then(res => setFarmEvents(res.data));
                                    }} />
                                </div>
                                <div className="xl:col-span-2 p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm font-medium">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Field Evidence (farmOS Sync)</h2>
                                    {farmEvents.length === 0 ? (
                                        <div className="flex items-center justify-center p-12 text-slate-400 italic">
                                            No field events have been logged yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4 text-sm">
                                            {farmEvents.map(event => (
                                                <div key={event.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">
                                                                {event.event_type}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400">
                                                                {new Date(event.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{event.plot_name}</h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300">Farmer: {event.farmer_name}</p>
                                                        {event.notes && <p className="text-sm text-slate-400 mt-2 italic">"{event.notes}"</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        {event.quality_grade && (
                                                            <div className="mb-2">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${event.quality_grade === 'A' ? 'bg-green-100 text-green-700' : event.quality_grade === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    Grade {event.quality_grade}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {event.location && (
                                                            <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-bold">
                                                                <MapPin size={10} /> GPS Verified
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        } />

                        <Route path="compliance" element={
                            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Authoritative EUDR Compliance Certificates</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-gray-100 dark:border-gray-700 uppercase tracking-widest text-xs font-bold">
                                                <th className="pb-4 font-bold">Plot ID</th>
                                                <th className="pb-4 font-bold">Location Name</th>
                                                <th className="pb-4 font-bold">Status</th>
                                                <th className="pb-4 font-bold">Last Audited</th>
                                                <th className="pb-4 font-bold text-right">Certificate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {plots.map(plot => (
                                                <tr key={plot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="py-4 font-mono text-xs text-slate-400">{plot.id}</td>
                                                    <td className="py-4 font-bold text-slate-900 dark:text-white">{plot.name}</td>
                                                    <td className="py-4">
                                                        <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-tighter ${plot.is_eudr_compliant ? 'text-green-600' : 'text-red-500'}`}>
                                                            {plot.is_eudr_compliant ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                                            {plot.is_eudr_compliant ? 'Compliant' : 'Risk Flagged'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-slate-500 text-sm font-mono">{new Date(plot.last_checked_at).toLocaleDateString()}</td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleDownloadCertificate(plot.id)}
                                                            disabled={downloadingCert === plot.id || !plot.is_eudr_compliant}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-900 hover:bg-primary hover:text-white border border-transparent rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                        >
                                                            {downloadingCert === plot.id ? <Loader2 className="animate-spin" size={12} /> : <Download size={12} />}
                                                            {plot.is_eudr_compliant ? 'Download PDF' : 'Restricted'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        } />

                        {/* Admin Specific Routes */}
                        <Route path="system" element={
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Activity size={20} className="text-primary" />
                                        System Health Observability
                                    </h2>
                                    <button 
                                        onClick={fetchSystemHealth}
                                        disabled={isPollingHealth}
                                        className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                                    >
                                        <RefreshCw size={16} className={`${isPollingHealth ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <HealthMetricCard 
                                        title="Database Connectivity" 
                                        value={systemHealth?.services.database.status || 'Checking...'}
                                        status={systemHealth?.services.database.status === 'connected' ? 'healthy' : systemHealth ? 'error' : 'loading'}
                                        icon={<Database size={24} />}
                                        subtitle={`Latency: ${systemHealth?.services.database.latency || 'N/A'}`}
                                    />
                                    <HealthMetricCard 
                                        title="Blockchain Sync" 
                                        value={systemHealth?.services.blockchain_sync.status || 'Unknown'}
                                        status={systemHealth?.services.blockchain_sync.status === 'active' ? 'healthy' : systemHealth ? 'warning' : 'loading'}
                                        icon={<Shield size={24} />}
                                        subtitle={`Last: ${systemHealth?.services.blockchain_sync.last_synced_batch || 'None'}`}
                                    />
                                    <HealthMetricCard 
                                        title="Memory Footprint" 
                                        value={systemHealth?.infrastructure.memory_usage_mb ? `${systemHealth.infrastructure.memory_usage_mb} MB` : '0 MB'}
                                        status={systemHealth ? (systemHealth.infrastructure.memory_usage_mb > 500 ? 'warning' : 'healthy') : 'loading'}
                                        icon={<HardDrive size={24} />}
                                        subtitle="RSS (Process)"
                                    />
                                    <HealthMetricCard 
                                        title="System Uptime" 
                                        value={systemHealth?.infrastructure.process_uptime || 'N/A'}
                                        status={systemHealth ? 'healthy' : 'loading'}
                                        icon={<Clock size={24} />}
                                        subtitle={`v${systemHealth?.infrastructure.python_version.split(' ')[0] || ''}`}
                                    />
                                </div>

                                <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900 dark:text-blue-100">Live Infrastructure Insights</h4>
                                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                                            The platform is running on <strong>{systemHealth?.infrastructure.os || '...'}</strong> with {systemHealth?.infrastructure.cpu_percent}% CPU utilization.
                                            Blockchain events are being polled via the <code>VunachainListener</code> service.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        } />

                        <Route path="users" element={
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">User Management</h2>
                                        <p className="text-sm text-slate-500 font-medium tracking-tight">
                                            {userCategory === 'internal' 
                                                ? 'Govern platform administrators, auditors, and operations staff.' 
                                                : 'Monitor and manage external partners, field agents, and offtakers.'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-primary/20">
                                            <Users size={14} /> Add Staff Member
                                        </button>
                                    </div>
                                </div>

                                {/* Category Tabs */}
                                <div className="flex border-b border-gray-100 dark:border-gray-800">
                                    <button 
                                        onClick={() => setUserCategory('internal')}
                                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                            userCategory === 'internal' 
                                            ? 'border-primary text-primary bg-primary/5' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        Internal Ops
                                    </button>
                                    <button 
                                        onClick={() => setUserCategory('external')}
                                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                            userCategory === 'external' 
                                            ? 'border-primary text-primary bg-primary/5' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        External Partners
                                    </button>
                                </div>

                                <UserTable 
                                    users={usersList.filter(u => userCategory === 'internal' ? u.is_internal : !u.is_internal)} 
                                    onUpdate={handleUpdateUser}
                                    onDeactivate={handleDeactivateUser}
                                />
                            </div>
                        } />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
