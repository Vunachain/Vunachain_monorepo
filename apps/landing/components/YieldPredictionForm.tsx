import React, { useState } from 'react';
import { Plot } from '../types';

interface YieldPredictionFormProps {
    plots: Plot[];
    onPredictionGenerated: (prediction: any) => void;
}

const YieldPredictionForm: React.FC<YieldPredictionFormProps> = ({ plots, onPredictionGenerated }) => {
    const [selectedPlotId, setSelectedPlotId] = useState('');
    const [treeHealth, setTreeHealth] = useState(7);
    const [rainfall, setRainfall] = useState(120);
    const [fertilizer, setFertilizer] = useState(50);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCalculating(true);
        
        // Simulate a sophisticated ML algorithm delay
        setTimeout(() => {
            const plot = plots.find(p => p.id === selectedPlotId);
            const baseYield = (plot?.area_hectares || 1) * 800; // 800kg per hectare base
            const multiplier = (treeHealth / 10) * (rainfall / 100) * (1 + (fertilizer / 500));
            const predictedYield = Math.round(baseYield * multiplier);
            
            onPredictionGenerated({
                plotId: selectedPlotId,
                plotName: plot?.name || 'Unknown Plot',
                predictedYield,
                confidence: 0.85,
                timestamp: new Date().toISOString()
            });
            setIsCalculating(false);
        }, 1500);
    };

    return (
        <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Target Plot</label>
                <select 
                    required
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                    value={selectedPlotId}
                    onChange={(e) => setSelectedPlotId(e.target.value)}
                >
                    <option value="">-- Choose a plot --</option>
                    {plots.map(plot => (
                        <option key={plot.id} value={plot.id}>{plot.name} ({plot.area_hectares} Ha)</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest flex justify-between">
                        Tree Health Index
                        <span className="text-primary font-bold">{treeHealth}/10</span>
                    </label>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        value={treeHealth}
                        onChange={(e) => setTreeHealth(parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Rainfall (Last 30 Days)</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            required
                            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="mm"
                            value={rainfall}
                            onChange={(e) => setRainfall(parseInt(e.target.value))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Fertilizer Inputs (kg/Ha)</label>
                <input 
                    type="number" 
                    required
                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="kg"
                    value={fertilizer}
                    onChange={(e) => setFertilizer(parseInt(e.target.value))}
                />
            </div>

            <button 
                type="submit" 
                disabled={isCalculating}
                className={`w-full py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3 ${isCalculating ? 'opacity-80' : 'hover:bg-primary dark:hover:bg-primary dark:hover:text-white'}`}
            >
                {isCalculating ? (
                    <>
                        <span className="material-symbols-outlined animate-spin">cyclone</span>
                        Analyzing Satellite Data...
                    </>
                ) : (
                    <>
                        <span className="material-symbols-outlined">analytics</span>
                        Generate Yield Forecast
                    </>
                )}
            </button>
        </form>
    );
};

export default YieldPredictionForm;
