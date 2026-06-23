'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    Users, Shield, Package, Key,
    Activity, TrendingUp, CheckCircle, AlertCircle,
} from 'lucide-react';

interface Stats {
    users: number;
    roles: number;
    permissions: number;
    modules: number;
}

export default function DashboardPage() {
    const { user, permissions, sidebar } = useAuth();
    const role = user?.role as any;
    const [stats, setStats] = useState<Stats>({ users: 0, roles: 0, permissions: 0, modules: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, rolesRes, permsRes, modsRes] = await Promise.allSettled([
                    api.get('/users?limit=1'),
                    api.get('/roles'),
                    api.get('/permissions'),
                    api.get('/modules'),
                ]);

                setStats({
                    users: usersRes.status === 'fulfilled' ? usersRes.value.data.data?.pagination?.total || 0 : 0,
                    roles: rolesRes.status === 'fulfilled' ? (rolesRes.value.data.data?.length || 0) : 0,
                    permissions: permsRes.status === 'fulfilled' ? (permsRes.value.data.data?.length || 0) : 0,
                    modules: modsRes.status === 'fulfilled' ? (modsRes.value.data.data?.length || 0) : 0,
                });
            } catch { }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.users, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
        { label: 'Roles', value: stats.roles, icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        { label: 'Permissions', value: stats.permissions, icon: Key, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
        { label: 'Modules', value: stats.modules, icon: Package, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    ];

    return (
        <div>
            {/* Welcome */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--accent), #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <TrendingUp size={22} color="white" />
                    </div>
                    <div>
                        <h1 className="page-title" style={{ fontSize: '1.75rem' }}>
                            Welcome back, {user?.firstName}! 👋
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {role?.isSuperAdmin
                                ? 'You have full system access'
                                : `Logged in as ${role?.name} · ${permissions.length} permissions active`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {statCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="stat-card">
                            <div className="stat-icon" style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                                <Icon size={22} color={card.color} />
                            </div>
                            <div>
                                <div className="stat-value">
                                    {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : card.value}
                                </div>
                                <div className="stat-label">{card.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Two column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* My Permissions */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Key size={18} color="var(--accent)" />
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>My Permissions</h3>
                        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                            {permissions.length}
                        </span>
                    </div>
                    {role?.isSuperAdmin ? (
                        <div className="alert alert-success">
                            <CheckCircle size={16} />
                            Super Admin — All permissions granted
                        </div>
                    ) : permissions.length === 0 ? (
                        <div className="alert alert-error">
                            <AlertCircle size={16} />
                            No permissions assigned
                        </div>
                    ) : (
                        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                            {permissions.map(perm => {
                                const [module, action] = perm.split(':');
                                return (
                                    <div key={perm} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.5rem 0.625rem', borderRadius: 6, marginBottom: 4,
                                        background: 'var(--bg-elevated)',
                                    }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                            {module}
                                        </span>
                                        <span className={`permission-chip chip-${action}`}>{action}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Accessible Sidebar Modules */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Activity size={18} color="var(--success)" />
                        <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Accessible Modules</h3>
                        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
                            {sidebar.length}
                        </span>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {sidebar.map(item => (
                            <div key={item._id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 0.625rem', borderRadius: 6, marginBottom: 4,
                                background: 'var(--bg-elevated)',
                            }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {item.name}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {item.permissions.map(p => (
                                        <span key={p} className={`permission-chip chip-${p}`}>{p}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
