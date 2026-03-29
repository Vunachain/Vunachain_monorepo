import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import EventLogForm from '../components/EventLogForm';
import FulfillmentBar from '../components/FulfillmentBar';
import ContractDetailModal from '../components/ContractDetailModal';
import { farmerApi, plotApi, complianceApi, contractApi, analyticsApi } from '../lib/api';
import { Farmer, Plot } from '../types';
import FarmerOnboardingWizard from '../components/FarmerOnboardingWizard';
import { VolumeTimeAreaChart, ComplianceDonutChart } from '../components/DashboardCharts';
import { motion, AnimatePresence } from 'framer-motion';

const CoopManagerDashboard: React.FC = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [summary, setSummary] = useState<{ total_plots: number, compliant_count: number, compliance_rate: number } | null>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [farmersRes, plotsRes, summaryRes, contractsRes, metricsRes] = await Promise.all([
                farmerApi.list(),
                plotApi.list(),
                complianceApi.getSummary(),
                contractApi.list(),
                analyticsApi.getMetrics()
            ]);
            setFarmers(farmersRes.data.results || farmersRes.data || []);
            setPlots(plotsRes.data.results || plotsRes.data || []);
            setSummary(summaryRes.data);
            setContracts(contractsRes.data.results || contractsRes.data || []);
            setMetrics(metricsRes.data);
        } catch (err) {
            console.error('Error fetching Coop Manager data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAcceptContract = async (id: string) => {
        try {
            await contractApi.accept(id);
            fetchData();
        } catch (error) {
            alert('Failed to accept contract.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 font-medium">Loading cooperative data...</p>
                </div>
            </div>
        );
    }

    const filteredFarmers = farmers.filter(f =>
        (f.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-6 space-y-8 animate-fade-in">
            <Routes>
                <Route index element={
                    <div className="space-y-8 animate-fade-in">
                        {/* Welcome Banner */}
                        <div className="relative overflow-hidden rounded-lg bg-primary text-white shadow-sm p-6">
                            <div className="relative z-10">
                                <h1 className="text-3xl font-bold mb-2">Cooperative Console</h1>
                                <p className="text-green-50 text-lg max-w-xl">
                                    Managing {farmers.length} farmers across {plots.length} plots. Your compliance rate is{' '}
                                    <span className="font-bold">{summary?.compliance_rate?.toFixed(1) ?? '—'}%</span>.
                                </p>
                                <div className="flex gap-3 mt-8 flex-wrap">
                                    <button
                                        onClick={() => navigate('farmers')}
                                        className="bg-white text-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors shadow-sm"
                                    >
                                        View Members ({farmers.length})
                                    </button>
                                    <button
                                        onClick={() => navigate('harvests')}
                                        className="bg-green-800/40 text-white backdrop-blur-sm border border-white/20 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-800/60 transition-colors"
                                    >
                                        Log Harvest
                                    </button>
                                </div>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
                            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                        </div>

                        {/* Analytics Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Volume Chart */}
                            <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-black/5">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Supply Trends</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Aggregated harvest volume (MT)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-[10px] font-black uppercase">Live</div>
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    {metrics?.charts?.weekly_volume && (
                                        <VolumeTimeAreaChart data={metrics.charts.weekly_volume} />
                                    )}
                                </div>
                            </div>

                            {/* Compliance Donut */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-black/5 flex flex-col">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">EUDR Portfolio</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">Compliance distribution</p>
                                <div className="flex-1 min-h-[250px] relative">
                                    {metrics?.charts?.compliance_distribution && (
                                        <ComplianceDonutChart data={metrics.charts.compliance_distribution} />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center mt-[-20px]">
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{summary?.compliance_rate?.toFixed(0) ?? 0}%</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Rate</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats: MVP North Star Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { 
                                    icon: 'trending_down', 
                                    label: 'Side-Selling Imp.', 
                                    value: `+${metrics?.metrics?.side_selling_improvement ?? 0}%`, 
                                    sub: 'Vs. regional baseline', 
                                    color: 'green' 
                                },
                                { 
                                    icon: 'bolt', 
                                    label: 'Avg. Payout Speed', 
                                    value: (metrics?.metrics?.avg_payment_speed_minutes ?? 0) < 60 
                                        ? `${metrics?.metrics?.avg_payment_speed_minutes ?? 0}m` 
                                        : `${(metrics?.metrics?.avg_payment_speed_minutes / 60).toFixed(1)}h`, 
                                    sub: 'Target: < 24 hours', 
                                    color: 'blue' 
                                },
                                { 
                                    icon: 'gavel', 
                                    label: 'Dispute Rate', 
                                    value: `${metrics?.metrics?.dispute_rate ?? 0}%`, 
                                    sub: 'Collection conflicts', 
                                    color: 'amber' 
                                },
                                { 
                                    icon: 'verified', 
                                    label: 'Plot Status', 
                                    value: `${summary?.compliance_rate?.toFixed(1) ?? '—'}%`, 
                                    sub: `${summary?.compliant_count ?? 0} of ${summary?.total_plots ?? 0} plots`, 
                                    color: 'indigo' 
                                },
                            ].map((stat, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-lg shadow-black/5 hover:transform hover:scale-[1.02] transition-all cursor-default"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                            <span className="material-symbols-outlined">{stat.icon}</span>
                                        </div>
                                        <span className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{stat.sub}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Geospatial Map */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">map</span>
                                Geospatial Plot View
                            </h2>
                            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                <MapComponent plots={plots} />
                            </div>
                        </div>
                    </div>
                } />

                <Route path="farmers" element={
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Farmer Register</h2>
                                <p className="text-slate-500 dark:text-slate-400">{farmers.length} registered farmers in your cooperative.</p>
                            </div>
                            <button 
                                onClick={() => setShowWizard(true)}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                                Register Farmer
                            </button>
                        </div>

                        {/* Search */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search members by name..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {/* Members Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-slate-500 uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Farmer</th>
                                            <th className="px-6 py-4">Verification</th>
                                            <th className="px-6 py-4">Plots</th>
                                            <th className="px-6 py-4 text-right">Credit Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredFarmers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No farmers found.</td>
                                            </tr>
                                        ) : (
                                            filteredFarmers.map(farmer => (
                                                <tr key={farmer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-900 dark:text-white">{farmer.full_name}</p>
                                                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                            {farmer.celo_address ? `${farmer.celo_address.slice(0, 6)}...${farmer.celo_address.slice(-4)}` : 'No wallet linked'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${farmer.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                                            {farmer.is_verified ? 'Verified' : 'Pending KYC'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                        {plots.filter(p => p.farmer === farmer.id).length} Active
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                        {farmer.credit_score || '—'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="harvests" element={
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
                        <div className="xl:col-span-1">
                            <EventLogForm farmers={farmers} plots={plots} onSuccess={() => {}} />
                        </div>
                        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                Verified Supply Chain Events
                            </h2>
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">inventory_2</span>
                                <p className="text-center">No harvests recorded for this cooperative yet.<br/>Use the form on the left to log farmer deliveries.</p>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="payouts" element={
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            Payout History & Status
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Manage M-Pesa B2C disbursements and Merkle batch claims.
                        </p>
                        <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-4 text-slate-300">credit_card_off</span>
                            <p className="font-medium">Connect M-Pesa Sandbox API to simulate payouts.</p>
                        </div>
                    </div>
                } />

                <Route path="contracts" element={
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Digital Supply Contracts</h2>
                            <div className="flex gap-2">
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-gray-700 rounded-lg shadow-sm">All</button>
                                    <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Active</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Open Needs Section */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Open Opportunities from Buyers
                                </h3>
                                {contracts.filter(c => c.status === 'OPEN').length === 0 ? (
                                    <div className="p-12 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-slate-400 text-sm">No open needs at the moment.</p>
                                    </div>
                                ) : (
                                    contracts.filter(c => c.status === 'OPEN').map(contract => (
                                        <div key={contract.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary transition-all group">
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-primary tracking-tighter mb-1">Buyer: {contract.buyer_name}</p>
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{contract.commodity}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">${contract.price_per_kg_cusd}/kg</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">Target: {contract.target_volume_kg}kg</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-6">
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{contract.quality_specs}"</p>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedContract(contract)}
                                                className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all transform active:scale-95 shadow-sm shadow-black/10"
                                            >
                                                Review & Sign
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Active Contracts Section */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    My Active Supply Obligations
                                </h3>
                                {contracts.filter(c => c.status === 'ACTIVE').length === 0 ? (
                                    <div className="p-12 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-slate-400 text-sm">No active contracts assigned to your cooperative.</p>
                                    </div>
                                ) : (
                                    contracts.filter(c => c.status === 'ACTIVE').map(contract => (
                                        <div key={contract.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-primary/20 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-3">
                                                <span className="material-symbols-outlined text-green-500 animate-pulse">check_circle</span>
                                            </div>
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{contract.commodity}</h4>
                                                    <p className="text-xs text-slate-500">Contract with {contract.buyer_name}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Target Volume</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{contract.target_volume_kg}kg</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Locked Price</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">${contract.price_per_kg_cusd}/kg</p>
                                                </div>
                                            </div>
                                            <div className="mb-6">
                                                <FulfillmentBar 
                                                    actual_volume={contract.actual_volume_kg || 0}
                                                    target_volume={contract.target_volume_kg}
                                                    status={contract.status}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setSelectedContract(contract)}
                                                className="w-full py-3 border-2 border-slate-100 dark:border-gray-800 hover:border-primary text-slate-900 dark:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                View Performance
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                } />
            </Routes>

            {/* Modal Overlay for Wizard */}
            {showWizard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-screen overflow-y-auto">
                    <div className="my-auto w-full max-w-2xl">
                        <FarmerOnboardingWizard 
                            onSuccess={() => { 
                                setShowWizard(false); 
                                fetchData(); // Refresh data!
                            }} 
                            onCancel={() => setShowWizard(false)} 
                        />
                    </div>
                </div>
            )}

            {selectedContract && (
                <ContractDetailModal
                    contract={selectedContract}
                    onClose={() => setSelectedContract(null)}
                    onSign={selectedContract.status === 'OPEN' ? handleAcceptContract : undefined}
                    userRole="coop_manager"
                />
            )}
        </div>
    );
};

export default CoopManagerDashboard;
