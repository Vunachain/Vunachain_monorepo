import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FulfillmentBar from '../components/FulfillmentBar';
import { harvestApi, contractApi, analyticsApi } from '../lib/api';
import { ContractPerformanceRadar } from '../components/DashboardCharts';
import { motion } from 'framer-motion';

interface Batch {
    [key: string]: unknown;
}
interface Contract {
    [key: string]: unknown;
}
interface Metrics {
    [key: string]: unknown;
}

const OfftakerDashboard: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const navigate = useNavigate();
    const [newContract, setNewContract] = useState({
        commodity: 'Arabica Coffee',
        target_volume_kg: '',
        price_per_kg_cusd: '',
        quality_specs: '',
        grade: 'AA+',
        moisture: '12',
        certifications: [] as string[],
        deadline: ''
    });

    const [metrics, setMetrics] = useState<Metrics | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hRes, cRes, mRes] = await Promise.all([
                    harvestApi.list(),
                    contractApi.list(),
                    analyticsApi.getMetrics()
                ]);
                const batchesData = (hRes.data as Record<string, unknown>).results || hRes.data || [];
                setBatches(batchesData as Batch[]);
                const contractsData = (cRes.data as Record<string, unknown>).results || cRes.data || [];
                setContracts(contractsData as Contract[]);
                setMetrics(mRes.data as Metrics);
            } catch (err) {
                console.error('Error fetching Offtaker data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalSpecs = `Grade: ${newContract.grade} | Moisture: <${newContract.moisture}% | Certs: ${newContract.certifications.join(', ') || 'None'} ${newContract.quality_specs ? ' | ' + newContract.quality_specs : ''}`;
            const submitData = { ...newContract, quality_specs: finalSpecs };

            await contractApi.create(submitData);
            const res = await contractApi.list();
            const contractsData = (res.data as Record<string, unknown>).results || res.data || [];
            setContracts(contractsData as Contract[]);
            setShowCreateModal(false);
            setNewContract({
                commodity: 'Arabica Coffee',
                target_volume_kg: '',
                price_per_kg_cusd: '',
                quality_specs: '',
                grade: 'AA+',
                moisture: '12',
                certifications: [],
                deadline: ''
            });
            navigate('needs');
        } catch {
            alert('Failed to create supply request. Ensure all fields are valid.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 font-medium">Verifying traceability chain...</p>
                </div>
            </div>
        );
    }

    // Derived stats from live contract data
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'OPEN');
    const completedContracts = contracts.filter(c => c.status === 'COMPLETED');
    const totalVolumeKg = contracts.reduce((sum, c) => sum + (parseFloat(c.actual_volume_kg) || 0), 0);

    // Dynamic top cooperatives — group by cooperative name from contracts
    const coopMap: Record<string, { name: string; count: number; volume: number }> = {};
    contracts.forEach((c) => {
        const name = c.cooperative_name || c.cooperative || 'Unknown Cooperative';
        if (!coopMap[name]) {
            coopMap[name] = { name, count: 0, volume: 0 };
        }
        coopMap[name].count += 1;
        coopMap[name].volume += parseFloat(c.actual_volume_kg) || 0;
    });
    const topCooperatives = Object.values(coopMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // Fallback static cooperatives when no contract data yet
    const displayCoops = topCooperatives.length > 0 ? topCooperatives : [
        { name: 'Nyeri Farmers Coop', count: 5, volume: 1200 },
        { name: 'Meru Central', count: 4, volume: 850 },
        { name: 'Kirinyaga Star', count: 3, volume: 1500 },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    EUDR Compliance Portal
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Verified traceability for EU-destined agricultural products.</p>
            </div>

            <Routes>
                <Route index element={
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Search & Tools */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Trace Batch ID</h3>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Enter Batch Hash (0x...)"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-primary hover:bg-primary/90 transition-all p-6 rounded-lg text-white cursor-pointer group" onClick={() => setShowCreateModal(true)}>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[32px]">add_shopping_cart</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Create Supply Request</h3>
                                        <p className="text-xs text-white/80">Marketplace of verified cooperatives</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics & Marketplace Logic */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Fulfillment Radar */}
                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-black/5">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Contract Health</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Fulfillment across commodities</p>
                                    <div className="h-[300px]">
                                        {metrics?.charts?.contract_performance && (
                                            <ContractPerformanceRadar data={metrics.charts.contract_performance} />
                                        )}
                                    </div>
                                </div>

                                {/* Payout Speed / Market Stats */}
                                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-black/5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Capital Velocity</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Average settlement time</p>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-5xl font-black text-primary">
                                                {(metrics?.metrics?.avg_payment_speed_minutes ?? 0).toFixed(0)}
                                            </span>
                                            <span className="text-lg font-bold text-slate-400">min</span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">Vunachain Trust-Link settlements are ~400x faster than traditional trade finance.</p>
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Risk Rating</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">AAA</p>
                                        </div>
                                        <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                                            <p className="text-[10px] font-black text-green-600 uppercase mb-1">Verified MT</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white">{metrics?.metrics?.total_volume_mt ?? 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Marketplace Interaction */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Marketplace Pulse</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                                    {[
                                        { label: 'Active Needs', value: contracts.filter(c => c.status === 'OPEN').length, color: 'blue', icon: 'pending_actions' },
                                        { label: 'Verified Batches', value: batches.length, color: 'green', icon: 'inventory_2' },
                                        { label: 'Risk Flagged', value: 0, color: 'red', icon: 'flag' },
                                    ].map((stat, i) => (
                                        <motion.div 
                                            key={i} 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex flex-col gap-2 rounded-xl p-6 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-primary/40 transition-all"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`material-symbols-outlined text-[18px] text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.icon}</span>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{stat.label}</p>
                                            </div>
                                            <p className={`text-3xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                {/* Row 2: Contract-derived stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    {[
                                        { label: 'Active Contracts', value: activeContracts.length, icon: 'description', color: 'indigo' },
                                        { label: 'Completed', value: completedContracts.length, icon: 'task_alt', color: 'green' },
                                        { label: 'Total Volume (kg)', value: totalVolumeKg.toLocaleString(), icon: 'scale', color: 'purple' },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                            <div className={`p-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                                                <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{stat.label}</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Discovery Grid */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Performing Cooperatives</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {displayCoops.map((coop, i) => (
                                        <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/40 transition-all group cursor-pointer">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px]">groups</span>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                    {coop.count} contracts
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{coop.name}</h4>
                                            <p className="text-[10px] font-mono text-slate-400">Vol: {coop.volume.toLocaleString()}kg fulfilled</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-start gap-4">
                                <span className="material-symbols-outlined text-amber-600 text-3xl">info</span>
                                <div>
                                    <h4 className="font-bold text-amber-900 dark:text-amber-400">EUDR Deadline Notice</h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-500 mt-1 leading-relaxed">All batches arriving after Dec 2024 must include geolocation data verified by Vunachain Protocol.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="needs" element={
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Buyer Needs</h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all shadow-sm shadow-primary/20 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Create Supply Request
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {contracts.length === 0 ? (
                                <div className="lg:col-span-2 flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">shopping_cart_off</span>
                                    <p className="font-semibold text-slate-500">No buyer needs posted yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Post your first need to connect with verified cooperatives.</p>
                                </div>
                            ) : (
                                contracts.map(contract => (
                                    <div key={contract.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    contract.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                    {contract.status}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white">{contract.commodity}</h3>
                                            <p className="text-sm font-medium text-slate-500 mt-1">Target: {contract.target_volume_kg}kg • Price: ${contract.price_per_kg_cusd}/kg</p>

                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-tighter">Requirements</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{contract.quality_specs}</p>
                                            </div>

                                            <FulfillmentBar
                                                actual_volume={contract.actual_volume_kg || 0}
                                                target_volume={contract.target_volume_kg}
                                                status={contract.status}
                                            />
                                        </div>

                                        <div className="mt-6 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">event</span>
                                                <span className="text-xs text-slate-500 font-mono">Deadline: {contract.deadline || 'No deadline'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                } />

                <Route path="history" element={
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase History</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Completed contracts and finalized batch records.</p>
                        </div>

                        {completedContracts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">history</span>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No completed purchases yet</h3>
                                <p className="text-slate-400 max-w-md mx-auto mt-2 text-sm">Historical batch fulfillment and compliance records will appear here as you finalize contracts.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {completedContracts.map(contract => (
                                    <div key={contract.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">
                                                        {contract.buyer_name || 'Unknown Buyer'}
                                                    </p>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{contract.commodity}</h3>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                                                    Completed
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Cooperative</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {contract.cooperative_name || contract.cooperative || '—'}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Target Volume</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{contract.target_volume_kg}kg</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Price / kg</p>
                                                    <p className="text-sm font-bold text-primary">${contract.price_per_kg_cusd} cUSD</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Deadline</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{contract.deadline || '—'}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <FulfillmentBar
                                                    actual_volume={contract.actual_volume_kg || 0}
                                                    target_volume={contract.target_volume_kg}
                                                    status={contract.status}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                } />
            </Routes>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Create Supply Request</h3>
                            <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">close</button>
                        </div>
                        <form onSubmit={handleCreateContract} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Commodity</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={newContract.commodity}
                                        onChange={e => setNewContract({...newContract, commodity: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Target Vol (kg)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={newContract.target_volume_kg}
                                        onChange={e => setNewContract({...newContract, target_volume_kg: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Price per kg (cUSD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={newContract.price_per_kg_cusd}
                                    onChange={e => setNewContract({...newContract, price_per_kg_cusd: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none hover:cursor-pointer"
                                        value={newContract.grade}
                                        onChange={e => setNewContract({...newContract, grade: e.target.value})}
                                    >
                                        <option value="AA+">Grade A (Premium)</option>
                                        <option value="A">Grade B (Standard)</option>
                                        <option value="B">Grade C (Low)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Max Moisture (%)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={newContract.moisture}
                                        onChange={e => setNewContract({...newContract, moisture: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Certifications Needed</label>
                                <div className="flex gap-4">
                                    {['EUDR', 'Rainforest Alliance', 'Fairtrade', 'Organic EU'].map((cert) => (
                                        <label key={cert} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary"
                                                checked={newContract.certifications.includes(cert)}
                                                onChange={(e) => {
                                                    const newCerts = e.target.checked
                                                        ? [...newContract.certifications, cert]
                                                        : newContract.certifications.filter(c => c !== cert);
                                                    setNewContract({...newContract, certifications: newCerts});
                                                }}
                                            />
                                            {cert}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Additional Quality Notes (Optional)</label>
                                <textarea
                                    rows={2}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={newContract.quality_specs}
                                    onChange={e => setNewContract({...newContract, quality_specs: e.target.value})}
                                    placeholder="Extra requirements not covered above..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Delivery Deadline</label>
                                <input
                                    type="date"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    value={newContract.deadline}
                                    onChange={e => setNewContract({...newContract, deadline: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-lg font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 transform active:scale-[0.98] mt-4">
                                Create Supply Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfftakerDashboard;
