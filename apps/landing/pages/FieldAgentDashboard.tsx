import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import EventLogForm from '../components/EventLogForm';
import FarmerOnboardingForm from '../components/FarmerOnboardingForm';
import FarmerProfileModal from '../components/FarmerProfileModal';
import { farmerApi, plotApi, farmEventApi } from '../lib/api';
import { Farmer, Plot, FarmEvent } from '../types';

const FieldAgentDashboard: React.FC = () => {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [activeEvents, setActiveEvents] = useState<FarmEvent[]>([]);
    const [searchParams] = useSearchParams();
    const view = searchParams.get('view') || 'queue';
    const [loading, setLoading] = useState(true);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

    const handleEventClick = (event: FarmEvent) => {
        const farmer = farmers.find(f => f.full_name === event.farmer_name || f.id === event.farmer);
        if (farmer) setSelectedFarmer(farmer);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [farmersRes, plotsRes, eventsRes] = await Promise.all([
                    farmerApi.list(),
                    plotApi.list(),
                    farmEventApi.list()
                ]);
                setFarmers(farmersRes.data);
                setPlots(plotsRes.data);
                setActiveEvents(eventsRes.data);
            } catch (err) {
                console.error('Error fetching Field Agent data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 font-medium">Loading field tools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-6 space-y-8 animate-fade-in">
            {/* Page Header (Simplified) */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    Field Operations
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Nyeri Collection Point #04 • {view === 'queue' ? 'Reviewing Deliveries' : 'New Collection'}</p>
            </div>

            <main>
                {view === 'onboarding' ? (
                    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                        <div className="text-center">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Farmer Registration</h2>
                            <p className="text-slate-500 mt-2">Initialize a digital identity for the farmer on the Vunachain Protocol.</p>
                        </div>
                        <FarmerOnboardingForm onSuccess={() => window.location.search = '?view=queue'} />
                    </div>
                ) : view === 'queue' ? (
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pending Verification</h2>
                        {activeEvents.length === 0 ? (
                            <div className="p-12 text-center bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">task_alt</span>
                                <p className="text-slate-500 font-medium text-lg">All deliveries verified</p>
                                <p className="text-sm text-slate-400 mt-1">Ready for next collection.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeEvents.map(event => (
                                    <div 
                                        key={event.id} 
                                        onClick={() => handleEventClick(event)}
                                        className="p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between hover:border-primary/50 hover:shadow-sm transition-all group cursor-pointer transform active:scale-[0.99]"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-lg">{event.plot_name}</p>
                                            <p className="text-sm text-slate-500 mt-1">{event.farmer_name} • {event.event_type}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="text-xs flex items-center gap-1 text-slate-400">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span> 12m ago
                                                </span>
                                                <span className="text-xs flex items-center gap-1 text-primary font-bold">
                                                    <span className="material-symbols-outlined text-[14px]">gps_fixed</span> GPS OK
                                                </span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            {/* Quick Action */}
                            <div className="p-6 bg-primary text-white rounded-lg shadow-sm shadow-primary/20 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <p className="text-xs font-bold mb-1 opacity-80 uppercase tracking-wider">Instant Lookup</p>
                                    <h3 className="text-xl font-bold">Scan Farmer ID</h3>
                                    <p className="text-sm opacity-90 mt-2 leading-relaxed">Instantly fetch plot history and verification status.</p>
                                    <button className="mt-6 w-full py-3 bg-white text-primary rounded-lg font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                        <span className="material-symbols-outlined">photo_camera</span>
                                        Open Scanner
                                    </button>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-9xl">qr_code_scanner</span>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-5 rounded-lg">
                                <h4 className="text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2 text-sm">
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                    Verification Protocol
                                </h4>
                                <ul className="mt-3 text-xs space-y-2 text-amber-700 dark:text-amber-500 leading-relaxed list-disc pl-4">
                                    <li>Ensure GPS lock is active before logging.</li>
                                    <li>Farmer must be present for biometric check.</li>
                                    <li>Capture photo of weigh-in receipt.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Form Area */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">edit_note</span>
                                Log Farm Delivery
                            </h2>
                            <EventLogForm farmers={farmers} plots={plots} onSuccess={() => window.location.search = ''} />
                        </div>
                    </div>
                )}
            </main>

            {selectedFarmer && (
                <FarmerProfileModal
                    farmer={selectedFarmer}
                    events={activeEvents}
                    onClose={() => setSelectedFarmer(null)}
                />
            )}
        </div>
    );
};

export default FieldAgentDashboard;
