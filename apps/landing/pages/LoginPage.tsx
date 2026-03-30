import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { setTokens, decodeToken, getRoleDashboardPath } from '../lib/auth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const DEV_CREDENTIALS = [
    { role: 'System Admin',   username: 'admin',                  password: 'Vunachain2024!' },
    { role: 'Coop Manager',   username: 'nyeri_admin',            password: 'Vunachain2024!' },
    { role: 'Field Agent',    username: 'field_agent',            password: 'Vunachain2024!' },
    { role: 'Agronomist',     username: 'agronomist',             password: 'Vunachain2024!' },
    { role: 'Coffee Buyer',   username: 'coffee_intl_buyer',      password: 'Vunachain2024!' },
    { role: 'Grains Offtaker',username: 'global_grains_offtaker', password: 'Vunachain2024!' },
    { role: 'Auditor',        username: 'auditor',                password: 'Vunachain2024!' },
];

const LoginPage: React.FC = () => {
    const { isConnected, address } = useAccount();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showDevCreds, setShowDevCreds] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authApi.login({ username: email, password });
            setTokens(response.data.access, response.data.refresh);

            const payload = decodeToken();
            const role = payload?.primary_role ?? 'User';
            navigate(getRoleDashboardPath(role));
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex animate-fade-in">
            {/* Left Side - Hero Image */}
            <div
                className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-f8196812c850?q=80&w=1000&auto=format&fit=crop')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col justify-between p-16 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Vunachain Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Vunachain</span>
                    </div>

                    <div className="max-w-lg mb-12">
                        <h1 className="text-5xl font-black mb-6 leading-tight">Transparent Contract Farming on the Blockchain</h1>
                        <p className="text-lg text-gray-300 leading-relaxed">Ensuring EUDR compliance, fair pricing, and immutable on-chain traceability for Kenyan agriculture.</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-gray-900 relative overflow-y-auto">
                <div className="max-w-md w-full space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Vunachain Logo" className="w-7 h-7 object-contain brightness-0 invert" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Vunachain</span>
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Please sign in to your account to continue.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-fade-in">
                                <span className="material-symbols-outlined text-[20px] flex-shrink-0">error</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="login-email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Username / Email
                            </label>
                            <input
                                id="login-email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                placeholder="you@company.com or username"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label htmlFor="login-password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                                <button type="button" className="text-sm text-primary font-bold hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-lg shadow-sm shadow-primary/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black">
                                <span className="px-4 bg-white dark:bg-gray-900 text-slate-400">Wallet Access (SocialConnect)</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 items-center">
                            <ConnectButton.Custom>
                                {({
                                    account,
                                    chain,
                                    openAccountModal,
                                    openChainModal,
                                    openConnectModal,
                                    mounted,
                                }) => {
                                    const ready = mounted;
                                    const connected = ready && account && chain;
                                    
                                    return (
                                        <div
                                            {...(!ready && {
                                                'aria-hidden': true,
                                                'style': {
                                                    opacity: 0,
                                                    pointerEvents: 'none',
                                                    userSelect: 'none',
                                                },
                                            })}
                                            className="w-full"
                                        >
                                            {(() => {
                                                if (!connected) {
                                                    return (
                                                        <button
                                                            onClick={openConnectModal}
                                                            type="button"
                                                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-bold text-slate-700 dark:text-slate-300"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                                                            Link Wallet for SocialConnect
                                                        </button>
                                                    );
                                                }
                                                return (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                                                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Wallet Linked</p>
                                                                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400">{account.displayName}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={openAccountModal}
                                                                type="button"
                                                                className="text-xs font-bold text-primary hover:underline"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-center text-slate-400 leading-relaxed max-w-xs mx-auto">
                                                            By connecting, you enable SocialConnect identity mapping for your phone number.
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                }}
                            </ConnectButton.Custom>
                        </div>
                    </form>

                    <p className="text-center text-sm text-gray-500 pt-2">
                        Forgotten credentials? Contact your system administrator.
                    </p>

                    {import.meta.env.DEV && (
                        <div className="mt-6 border border-amber-200 dark:border-amber-800/40 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowDevCreds(!showDevCreds)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">developer_mode</span>
                                    Test Credentials (Dev Only)
                                </span>
                                <span className="material-symbols-outlined text-[16px]">{showDevCreds ? 'expand_less' : 'expand_more'}</span>
                            </button>
                            {showDevCreds && (
                                <div className="divide-y divide-amber-100 dark:divide-amber-900/20">
                                    {DEV_CREDENTIALS.map(cred => (
                                        <button
                                            key={cred.username}
                                            type="button"
                                            onClick={() => { setEmail(cred.username); setPassword(cred.password); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors text-left group"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{cred.role}</p>
                                                <p className="text-[11px] font-mono text-slate-400">{cred.username}</p>
                                            </div>
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to fill →</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
