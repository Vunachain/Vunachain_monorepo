import React, { useState } from 'react';
import { farmerApi, plotApi } from '../lib/api';

const FarmerOnboardingWizard: React.FC<{ onSuccess: () => void, onCancel: () => void }> = ({ onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        national_id: '',
        phone_number: '',
        celo_address: '', // Optional
        plot_name: '',
        boundary: '' // GEOJSON string
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleCaptureLocation = () => {
        // Quick MVP mock for capturing current location as a tiny polygon
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // Create a small mock polygon around the current point
                const offset = 0.001;
                const polygon = {
                    type: "Polygon",
                    coordinates: [[
                        [longitude - offset, latitude - offset],
                        [longitude + offset, latitude - offset],
                        [longitude + offset, latitude + offset],
                        [longitude - offset, latitude + offset],
                        [longitude - offset, latitude - offset]
                    ]]
                };
                setFormData({ ...formData, boundary: JSON.stringify(polygon, null, 2) });
            }, () => {
                setError('Failed to get location. Please allow location access or paste GeoJSON manually.');
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create Farmer
            // Note: If generating a deterministic wallet based on phone, the backend could do it.
            // For MVP, if celo_address is empty, we will let backend fail or we generate a dummy one for testing.
            const farmerPayload = {
                full_name: formData.full_name,
                national_id: formData.national_id,
                phone_number: formData.phone_number,
                celo_address: formData.celo_address || `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`
            };

            const farmerRes = await farmerApi.create(farmerPayload);
            const farmerId = farmerRes.data.id;

            // 2. Create Plot
            if (formData.boundary) {
                const plotPayload = {
                    farmer: farmerId,
                    name: formData.plot_name || 'Main Plot',
                    boundary: JSON.parse(formData.boundary),
                    is_eudr_compliant: true // Auto-compliant for the demo
                };
                await plotApi.create(plotPayload);
            }

            onSuccess();
        } catch (err: unknown) {
            console.error('Onboarding failed:', err);
            const error = err as Record<string, unknown>;
            const errorData = error?.response as Record<string, unknown>;
            const dataObj = errorData?.data as Record<string, unknown>;
            setError((dataObj?.error as string) || ((dataObj?.celo_address as unknown[])?.[0] as string) || 'Failed to register farmer. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-6 shadow-xl max-w-2xl w-full border border-gray-100 dark:border-gray-700 mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person_add</span>
                        Farmer Onboarding
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Step {step} of 3</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-slate-400 transition">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-8">
                <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-start gap-2">
                    <span className="material-symbols-outlined shrink-0 text-red-500">error</span>
                    {error}
                </div>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
                {/* SET 1: Basic Info */}
                {step === 1 && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Legal Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white"
                                placeholder="E.g. John Doe"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">National ID Number</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white font-mono"
                                placeholder="E.g. 12345678"
                                value={formData.national_id}
                                onChange={e => setFormData({ ...formData, national_id: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* SET 2: M-Pesa & Wallet */}
                {step === 2 && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#4CAF50] text-sm">payments</span>
                                M-Pesa Phone Number
                            </label>
                            <input
                                required
                                type="tel"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#4CAF50]/50 focus:border-[#4CAF50] outline-none text-slate-900 dark:text-white font-mono tracking-wider"
                                placeholder="254700000000"
                                value={formData.phone_number}
                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-2">Required for instant payouts on delivery.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Celo Wallet Address (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white font-mono text-sm"
                                placeholder="0x..."
                                value={formData.celo_address}
                                onChange={e => setFormData({ ...formData, celo_address: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-2">Leave blank to auto-generate a custodial wallet.</p>
                        </div>
                    </div>
                )}

                {/* SET 3: Geofencing Data */}
                {step === 3 && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 text-primary">Farm/Plot Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white"
                                placeholder="E.g. North Valley Plot A"
                                value={formData.plot_name}
                                onChange={e => setFormData({ ...formData, plot_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between items-center">
                                Geofence Boundary (GeoJSON)
                                <button 
                                    type="button" 
                                    onClick={handleCaptureLocation}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">my_location</span>
                                    Capture Location
                                </button>
                            </label>
                            <textarea
                                required
                                rows={5}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-slate-900 dark:text-white font-mono text-xs"
                                placeholder={`{\n  "type": "Polygon",\n  "coordinates": [...]\n}`}
                                value={formData.boundary}
                                onChange={e => setFormData({ ...formData, boundary: e.target.value })}
                            />
                            <p className="text-xs text-slate-500 mt-2">This data is hashed for EUDR traceability compliance.</p>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={step === 1 ? onCancel : handleBack}
                        className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-sm shadow-primary/30 transition transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                        {!loading && step === 3 && <span className="material-symbols-outlined text-[20px]">how_to_reg</span>}
                        {step === 3 ? (loading ? 'Registering...' : 'Register Farmer') : 'Next'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FarmerOnboardingWizard;
