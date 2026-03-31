import React, { useState } from 'react';
import { farmEventApi } from '../lib/api';
import { Farmer, Plot } from '../types';

interface EventLogFormProps {
    farmers: Farmer[];
    plots: Plot[];
    onSuccess?: () => void;
}

const EventLogForm: React.FC<EventLogFormProps> = ({ farmers, plots, onSuccess }) => {
    const [formData, setFormData] = useState({
        farmer_id: '',
        plot_id: '',
        event_type: 'INSPECTION',
        quality_grade: '',
        notes: '',
        location: null as { type: "Point", coordinates: [number, number] } | null,
        chemical_name: '',
        ph_level: '',
        photo_url: '',
    });
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [result, setResult] = useState<{ success: boolean, message: string } | null>(null);

    const filteredPlots = plots.filter(p => p.farmer === formData.farmer_id);

    const captureLocation = () => {
        setLocating(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData({
                        ...formData,
                        location: {
                            type: 'Point',
                            coordinates: [position.coords.longitude, position.coords.latitude]
                        }
                    });
                    setLocating(false);
                },
                (error) => {
                    console.error("GPS Error", error);
                    setResult({ success: false, message: 'Failed to capture GPS location.' });
                    setLocating(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setResult({ success: false, message: 'Geolocation is not supported by your browser.' });
            setLocating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const dataToSubmit: Record<string, unknown> = {
                farmer: formData.farmer_id,
                plot: formData.plot_id,
                event_type: formData.event_type,
                quality_grade: formData.quality_grade || null,
                notes: formData.notes,
                location: formData.location ? `SRID=4326;POINT(${formData.location.coordinates[0]} ${formData.location.coordinates[1]})` : null
                // Note: Normally chemical_name, ph_level, photo_url would be submitted
                // here for the backend to process the expanded event metadata.
            };

            await farmEventApi.create(dataToSubmit as any);
            setResult({
                success: true,
                message: `Farm event logged successfully.`
            });
            if (onSuccess) onSuccess();

            setFormData({
                ...formData,
                event_type: 'INSPECTION',
                quality_grade: '',
                notes: '',
                location: null,
                chemical_name: '',
                ph_level: '',
                photo_url: ''
            });
        } catch (err: unknown) {
            const error = err as Record<string, unknown>;
            const errorMsg = (error?.response as Record<string, unknown>)?.data;
            setResult({
                success: false,
                message: (errorMsg as any)?.error || 'Failed to log event.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Log Farm Event
            </h3>

            {result && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm animate-fade-in ${result.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'}`}>
                    <span className="material-symbols-outlined text-[20px] flex-shrink-0">{result.success ? 'check_circle' : 'error'}</span>
                    <span className="font-medium">{result.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Farmer</label>
                        <select
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white"
                            value={formData.farmer_id}
                            onChange={e => setFormData({ ...formData, farmer_id: e.target.value, plot_id: '' })}
                        >
                            <option value="">Choose a farmer...</option>
                            {farmers.map(f => (
                                <option key={f.id} value={f.id}>{f.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Plot</label>
                        <select
                            required
                            disabled={!formData.farmer_id}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            value={formData.plot_id}
                            onChange={e => setFormData({ ...formData, plot_id: e.target.value })}
                        >
                            <option value="">Choose a plot...</option>
                            {filteredPlots.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Activity Type</label>
                        <select
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white"
                            value={formData.event_type}
                            onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                        >
                            <option value="PLANTING">Planting</option>
                            <option value="INPUT_APPLICATION">Input Application</option>
                            <option value="HARVESTING">Harvesting</option>
                            <option value="INSPECTION">Inspection</option>
                            <option value="SOIL_TEST">Soil Test</option>
                            <option value="PEST_ALERT">Pest Alert</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    {formData.event_type === 'HARVESTING' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Quality Grade</label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white"
                                value={formData.quality_grade}
                                onChange={e => setFormData({ ...formData, quality_grade: e.target.value })}
                            >
                                <option value="">Not Graded</option>
                                <option value="A">Grade A (Premium)</option>
                                <option value="B">Grade B (Standard)</option>
                                <option value="C">Grade C (Low)</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    )}

                    {formData.event_type === 'INPUT_APPLICATION' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                                Chemical Applied
                                <span className="material-symbols-outlined text-[16px] text-amber-500" title="EUDR Tracking Required">warning</span>
                            </label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white"
                                value={formData.chemical_name}
                                onChange={e => setFormData({ ...formData, chemical_name: e.target.value })}
                                required
                            >
                                <option value="">Select chemical...</option>
                                <option value="UREA">Urea Fertilizer (Approved)</option>
                                <option value="NOPK">NPK 17-17-17 (Approved)</option>
                                <option value="GLYPHOSATE">Glyphosate Herbicides (Restricted)</option>
                                <option value="ORGANIC_COMPOST">Organic Compost</option>
                            </select>
                        </div>
                    )}

                    {formData.event_type === 'SOIL_TEST' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Measured pH Level</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0" max="14"
                                placeholder="Example: 6.5"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                value={formData.ph_level}
                                onChange={e => setFormData({ ...formData, ph_level: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {formData.event_type === 'PEST_ALERT' && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Photo Evidence</label>
                            <div className="w-full relative py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-slate-500 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined">add_a_photo</span>
                                <span className="text-sm font-bold">Capture Pest Photo</span>
                                <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex justify-between items-end">
                        <span>GPS Location</span>
                        <span className={`text-xs font-medium ${formData.location ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                            {formData.location ? '✓ Captured' : 'Required for proof'}
                        </span>
                    </label>
                    <button
                        type="button"
                        onClick={captureLocation}
                        disabled={locating}
                        className={`w-full py-3 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all text-sm font-medium ${
                            formData.location
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        {locating ? (
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[20px]">{formData.location ? 'gps_fixed' : 'my_location'}</span>
                        )}
                        {formData.location
                            ? `Lat: ${formData.location.coordinates[1].toFixed(4)}, Lng: ${formData.location.coordinates[0].toFixed(4)}`
                            : 'Capture Coordinates'}
                    </button>
                    {!formData.location && <p className="text-xs text-red-500 mt-2">Please capture GPS location before submitting.</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Field Notes</label>
                    <textarea
                        rows={3}
                        placeholder="Condition of crop, visible issues, verification notes..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all resize-none text-slate-900 dark:text-white placeholder-slate-400"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !formData.location || !formData.farmer_id || !formData.plot_id}
                    className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[20px]">send</span>
                            Submit Event to Ledger
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default EventLogForm;
