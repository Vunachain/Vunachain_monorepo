import React, { useState } from 'react';
import { 
    Activity, Database, Cpu, HardDrive, Clock, 
    Shield, ShieldAlert, CheckCircle2, XCircle, 
    UserCog, Trash2, Mail, Calendar, ExternalLink,
    AlertCircle
} from 'lucide-react';

// --- System Health Components ---

interface HealthMetricProps {
    title: string;
    value: string | number;
    status: 'healthy' | 'warning' | 'error' | 'loading';
    icon: React.ReactNode;
    subtitle?: string;
}

export const HealthMetricCard: React.FC<HealthMetricProps> = ({ title, value, status, icon, subtitle }) => {
    const statusColors = {
        healthy: 'text-green-500 bg-green-500/10 border-green-500/20',
        warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        error: 'text-red-500 bg-red-500/10 border-red-500/20',
        loading: 'text-slate-400 bg-slate-400/10 border-slate-400/20 animate-pulse'
    };

    return (
        <div className={`p-6 rounded-xl border bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md ${status === 'loading' ? 'grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${statusColors[status]}`}>
                    {icon}
                </div>
                {status !== 'loading' && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[status]}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        {status}
                    </div>
                )}
            </div>
            <h4 className="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
                {subtitle && <span className="text-xs text-slate-400 font-medium">{subtitle}</span>}
            </div>
        </div>
    );
};

// --- User Management Components ---

interface User {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
    roles: string[];
}

interface UserTableProps {
    users: User[];
    onUpdate: (id: number, data: Partial<User>) => void;
    onDeactivate: (id: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onUpdate, onDeactivate }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-slate-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-widest">
                            <th className="px-6 py-4">Identity</th>
                            <th className="px-6 py-4">Roles & Permissions</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Administrative</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{user.username}</p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                                <Mail size={12} /> {user.email || 'no-email@vunachain.com'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.is_staff && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] font-black rounded-full uppercase">
                                                Staff
                                            </span>
                                        )}
                                        {user.roles.map(role => (
                                            <span key={role} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => onUpdate(user.id, { is_active: !user.is_active })}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                            user.is_active 
                                            ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                                            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                        }`}
                                    >
                                        {user.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {user.is_active ? 'Active' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500 flex items-center gap-1.5 pt-7">
                                    <Calendar size={14} />
                                    {new Date(user.date_joined).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            title="Edit Permissions"
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                        >
                                            <UserCog size={18} />
                                        </button>
                                        <button 
                                            onClick={() => onDeactivate(user.id)}
                                            title="Deactivate Account"
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
