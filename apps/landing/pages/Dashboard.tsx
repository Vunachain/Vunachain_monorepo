import React, { useState, useEffect } from 'react';
import MapComponent from '../components/MapComponent';
import EventLogForm from '../components/EventLogForm';
import { farmerApi, plotApi, harvestApi, complianceApi, farmEventApi } from '../lib/api';
import { Farmer, Plot, FarmEvent } from '../types';
import { LayoutDashboard, Users, Map as MapIcon, Sprout, ShieldCheck, AlertTriangle, Download, FileText, Globe, Loader2, Camera, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [summary, setSummary] = useState<{ total_plots: number, compliant_count: number, compliance_rate: number } | null>(null);
    const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'farmers' | 'plots' | 'harvests' | 'compliance' | 'field_events'>('overview');
    const [loading, setLoading] = useState(true);
    const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('vunachain_token');
        setIsAuthenticated(!!token);

        const fetchData = async () => {
            try {
                const [farmersRes, plotsRes, summaryRes, eventsRes] = await Promise.all([
                    farmerApi.list(),
                    plotApi.list(),
                    complianceApi.getSummary(),
                    farmEventApi.list()
                ]);
                setFarmers(farmersRes.data);
                setPlots(plotsRes.data);
                setSummary(summaryRes.data);
                setFarmEvents(eventsRes.data);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Vunachain Dashboard</h1>
                    <p className="text-gray-400 mt-1">
                        {isAuthenticated ? 'Authorized Auditor Access' : 'Public "Passport" View (Restricted)'}
                    </p>
                </div>
                {isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-500 border border-white/10 rounded-lg text-sm font-medium transition-all"
                    >
                        Sign Out
                    </button>
                ) : (
                    <a
                        href="/login"
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-primary-500/20"
                    >
                        Auditor Login
                    </a>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('farmers')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'farmers' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <Users size={20} />
                        <span className="font-medium">Farmers</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('plots')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'plots' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <MapIcon size={20} />
                        <span className="font-medium">Plots</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('harvests')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'harvests' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <Sprout size={20} />
                        <span className="font-medium">Harvests</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'compliance' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <ShieldCheck size={20} />
                        <span className="font-medium">Compliance</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('field_events')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'field_events' ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <Camera size={20} />
                        <span className="font-medium">Field Events</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-grow">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-6 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Total Farmers</p>
                                        <p className="text-2xl font-bold">{summary?.total_plots || 0}</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4">
                                    <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Compliance Rate</p>
                                        <p className="text-2xl font-bold">{summary?.compliance_rate.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-lg bg-white/5 border border-white/10 flex items-center gap-4">
                                    <div className="p-3 bg-primary-500/20 rounded-lg text-primary-500">
                                        <Globe size={24} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">Verified Harvests</p>
                                        <p className="text-2xl font-bold">ALPHA</p>
                                    </div>
                                </div>
                            </div>

                            {/* Map Section */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold">Geospatial Compliance View</h2>
                                <MapComponent plots={plots} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'farmers' && (
                        <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                            <h2 className="text-xl font-bold mb-6">Farmer Directory</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-white/10">
                                            <th className="pb-4 font-medium">Name</th>
                                            <th className="pb-4 font-medium">Wallet Address</th>
                                            <th className="pb-4 font-medium">Phone</th>
                                            <th className="pb-4 font-medium text-right">Credit Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {farmers.map(farmer => (
                                            <tr key={farmer.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                                <td className="py-4 font-medium">{farmer.full_name || 'Restricted Profile'}</td>
                                                <td className="py-4 text-gray-400 font-mono text-sm">{farmer.celo_address || '0x... (Private)'}</td>
                                                <td className="py-4 text-gray-400">{farmer.phone_number || 'N/A'}</td>
                                                <td className="py-4 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${farmer.credit_score > 700 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                        {farmer.credit_score || 'Locked'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plots' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Managed Plots</h2>
                            <MapComponent plots={plots} />
                        </div>
                    )}

                    {activeTab === 'harvests' && (
                        <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                            <h2 className="text-xl font-bold mb-6">Recent Supply Chain Events</h2>
                            <div className="flex items-center justify-center p-12 text-gray-400 italic">
                                On-chain harvests will appear here as they are indexed by the listener.
                            </div>
                        </div>
                    )}
                    {activeTab === 'field_events' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-1">
                                <EventLogForm farmers={farmers} plots={plots} onSuccess={() => {
                                    farmEventApi.list().then(res => setFarmEvents(res.data));
                                }} />
                            </div>
                            <div className="xl:col-span-2 p-6 rounded-lg bg-white/5 border border-white/10">
                                <h2 className="text-xl font-bold mb-6">Agronomist Field Data (farmOS Sync)</h2>
                                {farmEvents.length === 0 ? (
                                    <div className="flex items-center justify-center p-12 text-gray-400 italic">
                                        No field events have been logged yet.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {farmEvents.map(event => (
                                            <div key={event.id} className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-1 bg-primary-500/20 text-primary-500 text-xs font-bold rounded-lg tracking-wider">
                                                            {event.event_type}
                                                        </span>
                                                        <span className="text-sm text-gray-400">
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-lg">{event.plot_name}</h4>
                                                    <p className="text-sm text-gray-300">Farmer: {event.farmer_name}</p>
                                                    {event.notes && <p className="text-sm text-gray-400 mt-2 italic">"{event.notes}"</p>}
                                                </div>
                                                <div className="text-right">
                                                    {event.quality_grade && (
                                                        <div className="mb-2">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${event.quality_grade === 'A' ? 'bg-green-500/20 text-green-500' : event.quality_grade === 'REJECTED' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                                Grade {event.quality_grade}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {event.location && (
                                                        <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                            <MapPin size={12} /> GPS Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'compliance' && (
                        <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                            <h2 className="text-xl font-bold mb-6">Authoritative EUDR Compliance Certificates</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-white/10">
                                            <th className="pb-4 font-medium">Plot ID</th>
                                            <th className="pb-4 font-medium">Location Name</th>
                                            <th className="pb-4 font-medium">Status</th>
                                            <th className="pb-4 font-medium">Last Audited</th>
                                            <th className="pb-4 font-medium text-right">Certificate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plots.map(plot => (
                                            <tr key={plot.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                                <td className="py-4 font-mono text-xs">{plot.id}</td>
                                                <td className="py-4 font-medium">{plot.name}</td>
                                                <td className="py-4">
                                                    <span className={`flex items-center gap-1.5 text-xs font-bold ${plot.is_eudr_compliant ? 'text-green-500' : 'text-red-500'}`}>
                                                        {plot.is_eudr_compliant ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                                                        {plot.is_eudr_compliant ? 'Compliant' : 'Risk Flagged'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-400 text-sm">{new Date(plot.last_checked_at).toLocaleDateString()}</td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => handleDownloadCertificate(plot.id)}
                                                        disabled={downloadingCert === plot.id || !plot.is_eudr_compliant}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-primary-500 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {downloadingCert === plot.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                                                        {plot.is_eudr_compliant ? 'Download PDF' : 'Restricted'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
