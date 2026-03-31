import React, { useState } from 'react';
import { farmerApi, plotApi } from '../lib/api';

interface FarmerOnboardingFormProps {
    onSuccess: () => void;
}

const FarmerOnboardingForm: React.FC<FarmerOnboardingFormProps> = ({ onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        national_id: '',
        celo_address: '',
        plot_name: '',
        area_hectares: '',
        crop: 'Coffee',
        latitude: '',
        longitude: ''
    });

    const handleLocationCapture = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                });
            }, () => {
                alert('Position capture failed. Please enable location services.');
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Farmer
            const farmerRes = await farmerApi.create({
                full_name: formData.full_name,
                phone_number: formData.phone_number,
                national_id: formData.national_id,
                celo_address: formData.celo_address || undefined
            });

            // 2. Create Plot for this farmer
            await plotApi.create({
                farmer: farmerRes.data.id,
                name: formData.plot_name,
                area_hectares: parseFloat(formData.area_hectares) || 0,
                crop_type: formData.crop,
                location_centroid: `POINT(${formData.longitude} ${formData.latitude})`
            });

            alert('Farmer and Plot onboarded successfully!');
            onSuccess();
        } catch (error) {
            console.error('Onboarding failed:', error);
            alert('Onboarding failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xl animate-slide-up">
            <div className="p-1 px-8 pt-8">
                 <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-700'}`}></div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Farmer Identity</h3>
                            <p className="text-sm text-slate-500 mt-1">Start by collecting basic identity details.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                    placeholder="e.g. John Doe"
                                    value={formData.full_name}
                                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="+254..."
                                        value={formData.phone_number}
                                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">National ID</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="ID Number"
                                        value={formData.national_id}
                                        onChange={e => setFormData({...formData, national_id: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 group"
                        >
                            Next: Plot Details
                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Plot & Crop</h3>
                            <p className="text-sm text-slate-500 mt-1">Specify where and what the farmer grows.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plot Alias</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                    placeholder="e.g. Upper Hill Plantation"
                                    value={formData.plot_name}
                                    onChange={e => setFormData({...formData, plot_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Area (Hectares)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        placeholder="0.00"
                                        value={formData.area_hectares}
                                        onChange={e => setFormData({...formData, area_hectares: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Crop Type</label>
                                    <select 
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                        value={formData.crop}
                                        onChange={e => setFormData({...formData, crop: e.target.value})}
                                    >
                                        <option>Coffee</option>
                                        <option>Tea</option>
                                        <option>Maize</option>
                                        <option>Avocado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 rounded-lg font-black uppercase tracking-widest text-xs transition-all"
                            >
                                Back
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStep(3)}
                                className="flex-[2] py-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 group"
                            >
                                Next: Verification
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">On-Site Verification</h3>
                            <p className="text-sm text-slate-500 mt-1">Capture coordinates and payment details.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg text-center space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Geolocation Stamp</p>
                                    <p className="text-xs text-slate-500">Capture the centroid of the plot to ensure EUDR compliance.</p>
                                </div>
                                {formData.latitude ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-mono text-[10px] bg-green-50 dark:bg-green-900/20 py-2 rounded-lg">
                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                        Captured: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                                    </div>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={handleLocationCapture}
                                        className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm shadow-primary/20 transform active:scale-95 transition-all"
                                    >
                                        Capture GPS
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Celo Wallet (Optional)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
                                    placeholder="0x..."
                                    value={formData.celo_address}
                                    onChange={e => setFormData({...formData, celo_address: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 rounded-lg font-black uppercase tracking-widest text-xs transition-all"
                            >
                                Back
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white group"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <>
                                        Finish Onboarding
                                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">cloud_upload</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default FarmerOnboardingForm;
