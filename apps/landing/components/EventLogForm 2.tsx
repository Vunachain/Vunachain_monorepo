import React, { useState } from 'react';
import { farmEventApi } from '../lib/api';
import { Farmer, Plot } from '../types';
import { Loader2, CheckCircle, AlertCircle, MapPin, Camera } from 'lucide-react';

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
            const dataToSubmit = {
                farmer: formData.farmer_id,
                plot: formData.plot_id,
                event_type: formData.event_type,
                quality_grade: formData.quality_grade || null,
                notes: formData.notes,
                location: formData.location ? `SRID=4326;POINT(${formData.location.coordinates[0]} ${formData.location.coordinates[1]})` : null
            };

            await farmEventApi.create(dataToSubmit);
            setResult({
                success: true,
                message: `Farm event logged successfully.`
            });
            if (onSuccess) onSuccess();
            
            // Revert to initial state
            setFormData({
                ...formData,
                event_type: 'INSPECTION',
                quality_grade: '',
                notes: '',
                location: null
            });
        } catch (err: any) {
            setResult({
                success: false,
                message: err.response?.data?.error || 'Failed to log event.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Camera className="text-primary-500 w-5 h-5" />
                Log Farm Event
            </h3>

            {result && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">{result.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Farmer</label>
                        <select
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.farmer_id}
                            onChange={e => setFormData({ ...formData, farmer_id: e.target.value, plot_id: '' })}
                        >
                            <option value="">Choose a farmer...</option>
                            {farmers.map(f => (
                                <option key={f.id} value={f.id} className="bg-background-dark">{f.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Plot</label>
                        <select
                            required
                            disabled={!formData.farmer_id}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
                            value={formData.plot_id}
                            onChange={e => setFormData({ ...formData, plot_id: e.target.value })}
                        >
                            <option value="">Choose a plot...</option>
                            {filteredPlots.map(p => (
                                <option key={p.id} value={p.id} className="bg-background-dark">{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Activity Type</label>
                        <select
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={formData.event_type}
                            onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                        >
                            <option value="PLANTING" className="bg-background-dark">Planting</option>
                            <option value="SPRAYING" className="bg-background-dark">Spraying</option>
                            <option value="HARVESTING" className="bg-background-dark">Harvesting</option>
                            <option value="INSPECTION" className="bg-background-dark">Inspection</option>
                            <option value="OTHER" className="bg-background-dark">Other</option>
                        </select>
                    </div>

                    {formData.event_type === 'HARVESTING' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Quality Grade</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                value={formData.quality_grade}
                                onChange={e => setFormData({ ...formData, quality_grade: e.target.value })}
                            >
                                <option value="" className="bg-background-dark">Not Graded</option>
                                <option value="A" className="bg-background-dark">Grade A (Premium)</option>
                                <option value="B" className="bg-background-dark">Grade B (Standard)</option>
                                <option value="C" className="bg-background-dark">Grade C (Low)</option>
                                <option value="REJECTED" className="bg-background-dark">Rejected</option>
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 flex justify-between items-end">
                        <span>GPS Location</span>
                        <span className="text-xs text-primary-500">{formData.location ? '✓ Captured' : 'Required for proof'}</span>
                    </label>
                    <button
                        type="button"
                        onClick={captureLocation}
                        disabled={locating}
                        className={`w-full py-3 rounded-lg border border-dashed flex items-center justify-center gap-2 transition-all ${formData.location ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'}`}
                    >
                        {locating ? <Loader2 className="animate-spin w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                        {formData.location 
                            ? `Lat: ${formData.location.coordinates[1].toFixed(4)}, Lng: ${formData.location.coordinates[0].toFixed(4)}` 
                            : 'Capture Coordinates'}
                    </button>
                    {!formData.location && <p className="text-xs text-red-400 mt-2">Please capture GPS location before submitting.</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Field Notes</label>
                    <textarea
                        rows={3}
                        placeholder="Condition of crop, visible issues, verification notes..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !formData.location || !formData.farmer_id || !formData.plot_id}
                    className="w-full mt-4 py-4 bg-primary-500 text-white font-bold rounded-lg shadow-sm shadow-primary-500/20 hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sumbit Event to Ledger'}
                </button>
            </form>
        </div>
    );
};

export default EventLogForm;
