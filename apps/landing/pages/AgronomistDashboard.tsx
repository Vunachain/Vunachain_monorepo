import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import YieldPredictionForm from '../components/YieldPredictionForm';
import DiagnosticModal from '../components/DiagnosticModal';
import { plotApi, farmEventApi, complianceApi } from '../lib/api';
import { Plot, FarmEvent } from '../types';

interface Prediction {
    [key: string]: unknown;
}

const AgronomistDashboard: React.FC = () => {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [farmEvents, setFarmEvents] = useState<FarmEvent[]>([]);
    const [summary, setSummary] = useState<{ total_plots: number, compliant_count: number, compliance_rate: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
    const [showNDVI, setShowNDVI] = useState(false);

    const fetchData = async () => {
        try {
            const [plotsRes, eventsRes, summaryRes] = await Promise.all([
                plotApi.list(),
                farmEventApi.list(),
                complianceApi.getSummary()
            ]);
            const plotsData = (plotsRes.data as Record<string, unknown>).results || plotsRes.data || [];
            setPlots(plotsData as Plot[]);
            const eventsData = (eventsRes.data as Record<string, unknown>).results || eventsRes.data || [];
            setFarmEvents(eventsData as FarmEvent[]);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error('Error fetching Agronomist data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprovePlot = async (id: string) => {
        try {
            await plotApi.approve(id);
            fetchData();
        } catch {
            alert('Failed to approve plot.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 font-medium">Loading soil & crop data...</p>
                </div>
            </div>
        );
    }

    const getEventColor = (type: string) => {
        switch (type) {
            case 'PLANTING': return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' };
            case 'SPRAYING': return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' };
            case 'HARVESTING': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' };
            case 'INSPECTION': return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' };
            default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
        }
    };

    return (
        <div className="p-6 lg:p-6 space-y-8 animate-fade-in">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
                    Agronomic Intelligence
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Monitoring {plots.length} plots for yield and sustainability.</p>
            </div>

            <Routes>
                <Route index element={
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
                        {/* Left Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-5 tracking-widest">Plot Health Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Total Area</span>
                                        <span className="font-bold text-slate-900 dark:text-white">142.5 Ha</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Compliance Rate</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">{summary?.compliance_rate?.toFixed(1) ?? '—'}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Flagged Risks</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">2 Plots</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">tips_and_updates</span>
                                    <div>
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">Smart Insight</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">Zone 4 soil pH levels are trending acidic. Consider lime application before next planting cycle.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Mini Map & Recent Logs */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-64">
                                <MapComponent plots={plots.slice(0, 5)} />
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activities</h3>
                                <div className="space-y-3">
                                    {farmEvents.slice(0, 3).map(event => {
                                        const colors = getEventColor(event.event_type);
                                        return (
                                            <div key={event.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-primary/30 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                                                        <span className="material-symbols-outlined text-[18px]">agriculture</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white tracking-tight">{event.event_type}</p>
                                                        <p className="text-xs text-slate-500">{event.plot_name}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">{new Date(event.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                } />

                <Route path="map" element={
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Plot Monitoring</h2>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowNDVI(!showNDVI)}
                                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-2 hover:shadow-sm transition-colors ${showNDVI ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">satellite_alt</span>
                                    {showNDVI ? 'NDVI Active' : 'Toggle NDVI'}
                                </button>
                                <button className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-primary/20 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">sync</span>
                                    farmOS
                                </button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-[600px] relative">
                            {showNDVI && (
                                <div className="absolute bottom-6 right-6 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl pointer-events-none fade-in">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">NDVI Health Index</h4>
                                    <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 bg-green-600 rounded-sm"></div><span className="text-xs font-mono text-slate-700 dark:text-slate-300">0.6 - 1.0 (Healthy)</span></div>
                                    <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div><span className="text-xs font-mono text-slate-700 dark:text-slate-300">0.3 - 0.6 (Stressed)</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-600 rounded-sm"></div><span className="text-xs font-mono text-slate-700 dark:text-slate-300">0.0 - 0.3 (Critical)</span></div>
                                </div>
                            )}
                            <MapComponent plots={plots} activeLayers={showNDVI ? ['ndvi'] : []} />
                        </div>
                    </div>
                } />

                <Route path="logs" element={
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Comprehensive Activity Logs</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {farmEvents.map(event => {
                                    const colors = getEventColor(event.event_type);
                                    return (
                                        <div key={event.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
                                                    <span className="material-symbols-outlined">agriculture</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{event.event_type}</p>
                                                    <p className="text-sm text-slate-500 mt-0.5">{event.plot_name} • Farmer ID: {event.farmer_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(event.timestamp).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-tighter">Verified by farmOS</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                } />

                <Route path="forecasting" element={
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Yield Intelligence</h2>
                                <p className="text-slate-500 mt-1">Simulate crop output based on environmental parameters.</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                <YieldPredictionForm plots={plots} onPredictionGenerated={setCurrentPrediction} />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Prediction Results</h3>
                            {currentPrediction ? (
                                <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl shadow-primary/30 relative overflow-hidden animate-slide-up">
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Estimated Output</p>
                                        <h4 className="text-6xl font-black tracking-tighter mb-4">{currentPrediction.predictedYield.toLocaleString()} <span className="text-2xl opacity-60">kg</span></h4>
                                        <p className="font-bold text-lg mb-8">For {currentPrediction.plotName}</p>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-md">
                                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Confidence</p>
                                                <p className="font-bold">{(currentPrediction.confidence * 100).toFixed(0)}%</p>
                                            </div>
                                            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-md">
                                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">Model Version</p>
                                                <p className="font-bold">v2.4-SAT</p>
                                            </div>
                                        </div>
                                        
                                        <button className="mt-10 w-full py-4 bg-white text-primary rounded-lg font-black uppercase tracking-widest text-xs transition-all hover:bg-green-50 shadow-sm">
                                            Export to farmOS
                                        </button>
                                    </div>
                                    <div className="absolute -right-12 -bottom-12 opacity-10">
                                        <span className="material-symbols-outlined text-[240px]">agriculture</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-6xl mb-4 opacity-20">insights</span>
                                    <p className="font-medium max-w-xs text-lg">Input plot data on the left to generate an AI yield forecast.</p>
                                </div>
                            )}
                        </div>
                    </div>
                } />

                <Route path="verification" element={
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verification Queue</h2>
                                <p className="text-slate-500 mt-1">Reviewing new plots for EUDR compliance status.</p>
                            </div>
                            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                                {plots.filter(p => !p.is_eudr_compliant).length} Pending Review
                            </span>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-slate-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Plot Name</th>
                                        <th className="px-6 py-4">Farmer</th>
                                        <th className="px-6 py-4">Area (Ha)</th>
                                        <th className="px-6 py-4">Risk Level</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {plots.filter(p => !p.is_eudr_compliant).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">All plots verified. Great job!</td>
                                        </tr>
                                    ) : (
                                        plots.filter(p => !p.is_eudr_compliant).map(plot => (
                                            <tr key={plot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{plot.name}</td>
                                                <td className="px-6 py-4 text-slate-500">Farmer ID: {plot.farmer}</td>
                                                <td className="px-6 py-4 font-mono text-xs">{plot.area_hectares} Ha</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Low Risk</span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedPlot(plot)}
                                                        className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors rounded-lg text-xs font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                                                        Diagnose
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApprovePlot(plot.id)}
                                                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm shadow-primary/20 transition-all transform active:scale-95"
                                                    >
                                                        Approve EUDR
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                } />
            </Routes>

            {selectedPlot && (
                <DiagnosticModal
                    plot={selectedPlot}
                    onClose={() => setSelectedPlot(null)}
                />
            )}
        </div>
    );
};

export default AgronomistDashboard;
