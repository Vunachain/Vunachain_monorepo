import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { setTokens, decodeToken, getRoleDashboardPath } from '../lib/auth';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                    </form>

                    <p className="text-center text-sm text-gray-500 pt-2">
                        Forgotten credentials? Contact your system administrator.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
