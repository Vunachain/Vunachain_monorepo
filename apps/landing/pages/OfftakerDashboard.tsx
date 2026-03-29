import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FulfillmentBar from '../components/FulfillmentBar';
import { harvestApi, contractApi, analyticsApi } from '../lib/api';

const topCooperatives = [
    { name: 'Nyeri Farmers Coop', score: 98, status: 'Top Rated', last_fulfilled: '1,200kg' },
    { name: 'Meru Central', score: 94, status: 'Premium', last_fulfilled: '850kg' },
    { name: 'Kirinyaga Star', score: 91, status: 'Certified', last_fulfilled: '1,500kg' }
];

const OfftakerDashboard: React.FC = () => {
    const [batches, setBatches] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hRes, cRes] = await Promise.all([
                    harvestApi.list(),
                    contractApi.list()
                ]);
                setBatches(hRes.data.results || hRes.data || []);
                setContracts(cRes.data.results || cRes.data || []);
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
            setContracts(res.data.results || res.data || []);
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
        } catch (error) {
            alert('Failed to post need. Ensure all fields are valid.');
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
                                        <h3 className="font-bold text-lg">Post New Need</h3>
                                        <p className="text-xs text-white/80">Marketplace of verified cooperatives</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Marketplace Interaction</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Active Needs', value: contracts.filter(c => c.status === 'OPEN').length, color: 'blue' },
                                        { label: 'Verified Batches', value: batches.length, color: 'green' },
                                        { label: 'Risk Flagged', value: 0, color: 'red' },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex flex-col gap-2 rounded-lg p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">{stat.label}</p>
                                            <p className={`text-3xl font-black text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Discovery Grid */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Performing Cooperatives</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {topCooperatives.map((coop, i) => (
                                        <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/40 transition-all group cursor-pointer">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px]">groups</span>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                    {coop.score} Score
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{coop.name}</h4>
                                            <p className="text-xs text-slate-500 mb-2">{coop.status}</p>
                                            <p className="text-[10px] font-mono text-slate-400">Avg Vol: {coop.last_fulfilled}</p>
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
                                Post New Need
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {contracts.length === 0 ? (
                                <div className="lg:col-span-2 p-16 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    <p className="text-slate-500 font-medium">You haven't posted any buyer needs yet.</p>
                                </div>
                            ) : (
                                contracts.map(contract => (
                                    <div key={contract.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    contract.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 
                                                    contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                                    'bg-gray-100 text-gray-700'
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
                    <div className="p-16 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg animate-fade-in">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-4">history</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Purchase History</h2>
                        <p className="text-slate-500 max-w-md mx-auto">Historical batch fulfillment and compliance records will appear here as you finalize contracts.</p>
                    </div>
                } />
            </Routes>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Post New Buyer Need</h3>
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
                                Publish Buyer Need
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfftakerDashboard;
