import React, { useState } from 'react';
import { getUserName, getUserRole, decodeToken, clearTokens } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

interface TokenPayload {
    [key: string]: unknown;
}

const ProfileSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const username = getUserName();
    const role = getUserRole();
    const tokenPayload = decodeToken() as any;

    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        email: tokenPayload?.email || 'user@example.com',
        phone: tokenPayload?.phone || '',
        organization: tokenPayload?.organization || tokenPayload?.cooperative_name || '',
    });

    const handleLogout = () => {
        clearTokens();
        navigate('/login');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Profile & Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your account settings and preferences</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-8">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl">
                            {username ? username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{username || 'User'}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
                                {role.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            {profileData.organization && (
                                <p className="text-sm text-primary font-semibold mt-2">{profileData.organization}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 rounded-lg font-semibold transition-all"
                    >
                        {editingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 -mx-8 mb-8 px-8">
                    {[
                        { id: 'profile', label: 'Profile Info', icon: 'person' },
                        { id: 'security', label: 'Security', icon: 'lock' },
                        { id: 'preferences', label: 'Preferences', icon: 'settings' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'preferences')}
                            className={`px-4 py-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Profile Info Tab */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white font-semibold">
                                    {username || 'User'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role</label>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white font-semibold capitalize">
                                    {role.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                            </div>
                        </div>

                        {editingProfile && (
                            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e: any) => setProfileData({...profileData, email: e.target.value})}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e: any) => setProfileData({...profileData, phone: e.target.value})}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Organization</label>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-slate-900 dark:text-white font-semibold">
                                        {profileData.organization || 'Not specified'}
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold transition-all">
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock</span>
                                Password Management
                            </h3>
                            <button className="w-full px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-all">
                                Change Password
                            </button>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-600">warning</span>
                                Danger Zone
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Logging out will clear your session and return you to the login page.
                            </p>
                            <button
                                onClick={handleLogout}
                                className="w-full px-6 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold transition-all"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">notifications</span>
                                Notifications
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Email Notifications', desc: 'Receive updates about your account' },
                                    { label: 'Harvest Updates', desc: 'Get notified about harvest events' },
                                    { label: 'Compliance Alerts', desc: 'Critical compliance notifications' },
                                    { label: 'Payment Notifications', desc: 'Updates about payments and payouts' }
                                ].map((item, i) => (
                                    <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-all">
                                        <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 text-primary rounded" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">palette</span>
                                Theme
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Light Theme', icon: 'light_mode' },
                                    { label: 'Dark Theme', icon: 'dark_mode' },
                                    { label: 'System Default', icon: 'settings_suggest' }
                                ].map((item) => (
                                    <label key={item.label} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-all">
                                        <input type="radio" name="theme" defaultChecked={item.label === 'System Default'} className="w-4 h-4 text-primary" />
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
