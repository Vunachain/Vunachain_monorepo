import React, { useState } from 'react';

interface PlotData {
    name: string;
    farmer: string;
    [key: string]: unknown;
}

interface DiagnosticModalProps {
    plot: PlotData;
    onClose: () => void;
}

const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ plot, onClose }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        diagnosisType: 'Pest Infestation',
        severity: 'Medium',
        notes: '',
        fertilizerRecommendation: '',
        pestControlMeasure: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate sending to farmOS/Blockchain
        setTimeout(() => {
            setSubmitting(false);
            alert(`Diagnosis for ${plot.name} submitted successfully and sent to Farmer ID: ${plot.farmer}!`);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-screen overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">medical_services</span>
                            Field Diagnostic Report
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Logging observation for <strong className="text-slate-700 dark:text-slate-300">{plot.name}</strong></p>
                    </div>
                    <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">close</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Primary Issue</label>
                            <select 
                                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.diagnosisType}
                                onChange={e => setFormData({...formData, diagnosisType: e.target.value})}
                            >
                                <option>Pest Infestation</option>
                                <option>Nutrient Deficiency</option>
                                <option>Water Stress</option>
                                <option>Disease Outbreak</option>
                                <option>General Health Check (OK)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Severity</label>
                            <select 
                                className="w-full p-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                value={formData.severity}
                                onChange={e => setFormData({...formData, severity: e.target.value})}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Observation Notes</label>
                        <textarea 
                            required
                            rows={3}
                            placeholder="Describe visual symptoms..."
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 space-y-4">
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">psychology</span>
                            Extension Recommendations
                        </h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-amber-700/70 mb-1 tracking-wider">Fertilizer Adjustment</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Apply 50kg CAN per hectare"
                                    className="w-full p-3 bg-white dark:bg-gray-900 border border-amber-200/50 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                    value={formData.fertilizerRecommendation}
                                    onChange={e => setFormData({...formData, fertilizerRecommendation: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-amber-700/70 mb-1 tracking-wider">Pest Control Measure</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Use organic neem oil extract"
                                    className="w-full p-3 bg-white dark:bg-gray-900 border border-amber-200/50 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
                                    value={formData.pestControlMeasure}
                                    onChange={e => setFormData({...formData, pestControlMeasure: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center items-center flex justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">send_to_mobile</span>
                        This recommendation will be sent to the farmer via SMS automatically.
                    </p>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-600/20 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Syncing to FarmOS...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[18px]">add_task</span> Submit Diagnosis</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DiagnosticModal;
