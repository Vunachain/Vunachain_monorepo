import React from 'react';
import { Farmer, FarmEvent } from '../types';

interface FarmerProfileModalProps {
    farmer: Farmer;
    events: FarmEvent[];
    onClose: () => void;
}

const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({ farmer, events, onClose }) => {
    // Determine last visit
    const farmerEvents = events.filter(e => e.farmer_name === farmer.full_name || e.farmer === farmer.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-screen overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                
                {/* Header (Profile Info) */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-primary/5 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border-4 border-white dark:border-gray-800 shadow-sm">
                            <span className="material-symbols-outlined text-4xl">person</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{farmer.full_name}</h2>
                                {farmer.is_verified && (
                                    <span className="material-symbols-outlined text-green-500 fill-current">verified</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 font-mono mb-3">ID: {farmer.id || 'N/A'}</p>
                            
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className={`px-2.5 py-1 rounded-lg font-bold ${farmer.is_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {farmer.is_verified ? 'KYC Verified' : 'Pending KYC'}
                                </span>
                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 rounded-lg">
                                    Credit Score: {farmer.credit_score || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content: Timeline */}
                <div className="p-6 overflow-y-auto flex-1">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">history</span>
                        Visit History & Event Log
                    </h3>

                    {farmerEvents.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_turned_in</span>
                            <p className="text-slate-500">No events logged for this farmer yet.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 pl-8 space-y-8">
                            {farmerEvents.map((event, index) => {
                                // determine color/icon
                                let color = 'bg-gray-100 text-gray-500';
                                let icon = 'event_note';
                                
                                switch(event.event_type) {
                                    case 'HARVESTING': color = 'bg-amber-100 text-amber-600'; icon = 'agriculture'; break;
                                    case 'INSPECTION': color = 'bg-purple-100 text-purple-600'; icon = 'search'; break;
                                    case 'PLANTING': color = 'bg-green-100 text-green-600'; icon = 'spa'; break;
                                    case 'INPUT_APPLICATION': color = 'bg-blue-100 text-blue-600'; icon = 'science'; break;
                                    case 'SOIL_TEST': color = 'bg-teal-100 text-teal-600'; icon = 'biotech'; break;
                                    case 'PEST_ALERT': color = 'bg-red-100 text-red-600'; icon = 'pest_control'; break;
                                }

                                return (
                                    <div key={event.id || index} className="relative">
                                        {/* Dot */}
                                        <div className={`absolute -left-[41px] top-1 w-8 h-8 rounded-full ${color} flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-sm`}>
                                            <span className="material-symbols-outlined text-[16px]">{icon}</span>
                                        </div>
                                        
                                        {/* Card */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{event.event_type.replace('_', ' ')}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">Plot: {event.plot_name}</p>
                                                </div>
                                                <span className="text-[10px] bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm font-mono text-slate-500">
                                                    {new Date(event.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            {event.notes && (
                                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-lg">
                                                    &quot;{event.notes}&quot;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-center">
                    <button 
                        onClick={onClose}
                        className="py-3 px-8 bg-white border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 dark:bg-gray-800 rounded-lg font-bold shadow-sm hover:shadow-sm transition-shadow"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FarmerProfileModal;
