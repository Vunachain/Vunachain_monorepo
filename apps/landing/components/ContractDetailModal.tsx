import React, { useState } from 'react';
import FulfillmentBar from './FulfillmentBar';

interface Contract {
    id: string;
    commodity: string;
    status: string;
    buyer_name: string;
    target_volume_kg: number;
    actual_volume_kg: number;
    quality_specs: string;
    deadline: string;
    price_per_kg_cusd: number;
    [key: string]: any;
}

interface ContractDetailModalProps {
    contract: Contract;
    onClose: () => void;
    onSign?: (id: string) => void;
    userRole?: 'coop_manager' | 'offtaker';
}

const ContractDetailModal: React.FC<ContractDetailModalProps> = ({ contract, onClose, onSign, userRole = 'coop_manager' }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'logistics' | 'financials' | 'clauses'>('details');
    const [isSigning, setIsSigning] = useState(false);

    const handleSign = async () => {
        setIsSigning(true);
        // Simulate Web3 wallet signature delay
        setTimeout(() => {
            setIsSigning(false);
            if (onSign) onSign(contract.id);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-screen overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
                    <div>
                        <div className="flex gap-2 items-center mb-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                contract.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 
                                contract.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {contract.status}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">ID: {contract.id?.substring(0,8) || '0xABCD1234'}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            {contract.commodity} Supply Contract
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 pt-2 bg-slate-50 dark:bg-gray-800/50 overflow-x-auto hide-scrollbar">
                    {['details', 'logistics', 'financials', 'clauses'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'details' | 'logistics' | 'financials' | 'clauses')}
                            className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-b-2 ${
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Buyer Details</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{contract.buyer_name || 'Vunachain Offtaker'}</p>
                                </div>
                                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Target Volume</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-xl">{contract.target_volume_kg?.toLocaleString()} kg</p>
                                </div>
                            </div>
                            
                            <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2">Quality & Certifications</p>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed italic border-l-2 border-blue-300 pl-3">
                                    {contract.quality_specs}
                                </p>
                            </div>

                            <FulfillmentBar 
                                actual_volume={contract.actual_volume_kg || 0} 
                                target_volume={contract.target_volume_kg || 1000} 
                                status={contract.status || 'OPEN'}
                                deadline={contract.deadline}
                            />
                        </div>
                    )}

                    {activeTab === 'logistics' && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="material-symbols-outlined text-slate-400">local_shipping</span>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Delivery Terms</p>
                                    <p className="text-sm text-slate-500 mt-1">FOB (Free On Board). Seller must deliver goods to the designated loading port.</p>
                                    <p className="text-xs font-mono bg-white dark:bg-gray-900 px-2 py-1 inline-block rounded mt-2 text-slate-600">Port of Mombasa, KE</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <span className="material-symbols-outlined text-slate-400">event</span>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Window</p>
                                    <p className="text-sm text-slate-500 mt-1">Delivery must be completed by <strong className="text-slate-700 dark:text-slate-300">{contract.deadline || 'specified deadline'}</strong> to avoid penalties.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-500 tracking-widest mb-1">Agreed Price Lock</p>
                                    <p className="text-3xl font-black text-green-700 dark:text-green-400">${contract.price_per_kg_cusd} <span className="text-base text-green-600/60 font-medium">cUSD / kg</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-green-600 dark:text-green-500 tracking-widest mb-1">Total Contract Value</p>
                                    <p className="text-xl font-black text-green-700 dark:text-green-400">${((contract.price_per_kg_cusd || 0) * (contract.target_volume_kg || 0)).toLocaleString()} cUSD</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Payment Schedule</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Milestone: Delivery at Collection Point</p>
                                    </div>
                                    <p className="font-bold text-sm">60%</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">2</div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Milestone: Quality Verification at Port</p>
                                    </div>
                                    <p className="font-bold text-sm">40%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clauses' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. EUDR Compliance</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Seller guarantees that all products supplied under this contract are compliant with the EU Deforestation Regulation (EUDR). Non-compliant batches will be rejected at Seller&apos;s expense.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. Force Majeure</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Neither party shall be liable for failure to perform its obligations if such failure is as a result of Acts of God (including fire, flood, earthquake, storm, hurricane or other natural disaster), war, invasion, act of foreign enemies.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Dispute Resolution</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Any dispute arising from or relating to this contract shall be governed by smart contract-based arbitration verified by the Vunachain decentralized tribunal.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-lg font-bold text-sm text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                    {contract.status === 'OPEN' && userRole === 'coop_manager' && onSign && (
                        <button 
                            onClick={handleSign}
                            disabled={isSigning}
                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all transform active:scale-95 shadow-sm shadow-black/10 flex items-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isSigning ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    <span>Signing with Wallet...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">draw</span>
                                    <span>Sign Binding Smart Contract</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ContractDetailModal;
