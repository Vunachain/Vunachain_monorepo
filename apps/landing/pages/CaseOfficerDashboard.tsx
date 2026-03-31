import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { contractApi, farmerApi } from '../lib/api';

interface Contract {
    id: string | number;
    status: string;
    commodity: string;
    buyer_name?: string;
    coop_name?: string;
    price_per_kg_cusd?: any;
    [key: string]: any;
}
interface Farmer {
    id: string | number;
    [key: string]: any;
}

const CaseOfficerDashboard: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cRes, fRes] = await Promise.all([
                    contractApi.list(),
                    farmerApi.list()
                ]);
                const contractsData = (cRes.data as Record<string, unknown>).results || cRes.data || [];
                setContracts(contractsData as Contract[]);
                const farmersData = (fRes.data as Record<string, unknown>).results || fRes.data || [];
                setFarmers(farmersData as Farmer[]);
            } catch (err: any) {
                console.error('Error fetching Case Officer data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-primary italic">Loading officer console...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <header>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">gavel</span>
                    Contract Administration
                </h1>
                <p className="text-slate-500 mt-1">Reviewing market needs and cooperative allocations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending Approval', value: contracts.filter(c => c.status === 'OPEN').length, icon: 'pending' },
                    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'ACTIVE').length, icon: 'assignment_turned_in' },
                    { label: 'Total Farmers', value: farmers.length, icon: 'groups' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                             <span className="material-symbols-outlined text-slate-400">{stat.icon}</span>
                        </div>
                        <p className="text-3xl font-black mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            <Routes>
                <Route index element={<Navigate to="contracts" replace />} />
                
                <Route path="contracts" element={
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Commodity</th>
                                    <th className="px-6 py-4">Buyer</th>
                                    <th className="px-6 py-4">Cooperative</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {contracts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">No contracts found in the registry.</td>
                                    </tr>
                                ) : (
                                    contracts.map(contract => (
                                        <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{contract.commodity}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{contract.buyer_name}</td>
                                            <td className="px-6 py-4 text-slate-500">{contract.coop_name || 'Unassigned'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                                    contract.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 
                                                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {contract.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-white">${contract.price_per_kg_cusd}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-lg transition-all">
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                } />

                <Route path="health" element={
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Network Compliance Health</h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'EUDR Verification Rate', value: 94, color: 'blue' },
                                    { label: 'Geolocation Accuracy', value: 98, color: 'green' },
                                    { label: 'Contract Fulfillment', value: 82, color: 'purple' },
                                    { label: 'Bio-diversity Protection', value: 89, color: 'amber' },
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
                                            <span className={`font-black text-${item.color}-600`}>{item.value}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                            <div className={`h-full bg-${item.color}-500 rounded-full transition-all duration-1000`} style={{ width: `${item.value}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-2">Protocol Staleness</h3>
                                <p className="text-slate-400 text-sm mb-8 font-medium">Monitoring node synchronization and data propagation.</p>
                                
                                <div className="flex items-center gap-4 mb-8">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="font-mono text-sm">Mainnet-v2-Sync: Healthy (0.1s latency)</span>
                                </div>

                                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-white/10">
                                    Run Full Network Diagnostic
                                </button>
                            </div>
                            <div className="absolute -right-12 -bottom-12 opacity-5">
                                <span className="material-symbols-outlined text-[200px]">hub</span>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="credit" element={
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Risk & Credit Oversight</h2>
                                <p className="text-slate-500 mt-1">Aggregated farmer credit scores and insurance risk profiles.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Avg Credit Score', value: '742', trend: '+12%', icon: 'credit_score' },
                                { label: 'Insurance Coverage', value: '88%', trend: '+5%', icon: 'security' },
                                { label: 'Total Premiums', value: '$124k', trend: '+2.1%', icon: 'account_balance' },
                                { label: 'Default Risk', value: '0.4%', trend: '-0.1%', icon: 'warning' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 rounded-lg">
                                            <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                                        </div>
                                        <span className={`text-[10px] font-black ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{stat.trend}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                } />
            </Routes>
        </div>
    );
};

export default CaseOfficerDashboard;
