'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { X, Shield, Search, AlertCircle, Loader2, Lock, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { Permission } from '@/types';

interface UserPermissionsModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

interface UserOverride {
    permission: Permission;
    type: 'allow' | 'deny';
}

export default function UserPermissionsModal({ userId, userName, onClose }: UserPermissionsModalProps) {
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [overrides, setOverrides] = useState<UserOverride[]>([]);
    const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userRes = await api.get(`/users/${userId}`);
                const roleId = userRes.data.data?.role?._id;

                const promises: Promise<any>[] = [
                    api.get('/permissions'),
                    api.get(`/permissions/users/${userId}`)
                ];
                if (roleId) {
                    promises.push(api.get(`/roles/${roleId}/permissions`));
                }

                const [permRes, overRes, rolePermsRes] = await Promise.all(promises);
                setAllPermissions(permRes.data.data || []);
                setOverrides(overRes.data.data || []);
                if (rolePermsRes) {
                    const rolePerms = rolePermsRes.data.data || [];
                    setRolePermissionIds(rolePerms.map((p: any) => p._id));
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to fetch permissions');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleToggle = async (permissionId: string, currentType: 'allow' | 'deny' | 'none', targetType: 'allow' | 'deny' | 'none') => {
        if (currentType === targetType) return;

        setSaving(permissionId);
        try {
            if (targetType === 'none') {
                await api.delete(`/permissions/users/${userId}/override/${permissionId}`);
                setOverrides(prev => prev.filter(o => {
                    const id = typeof o.permission === 'string' ? o.permission : o.permission._id;
                    return id !== permissionId;
                }));
            } else {
                await api.post(`/permissions/users/${userId}/override`, { permissionId, type: targetType });

                setOverrides(prev => {
                    const existingIndex = prev.findIndex(o => {
                        const id = typeof o.permission === 'string' ? o.permission : o.permission._id;
                        return id === permissionId;
                    });

                    if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex] = { ...updated[existingIndex], type: targetType };
                        return updated;
                    } else {
                        const perm = allPermissions.find(p => p._id === permissionId);
                        if (!perm) return prev;
                        return [...prev, { permission: perm, type: targetType }];
                    }
                });
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update override');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(null);
        }
    };

    const getOverrideType = (permissionId: string): 'allow' | 'deny' | 'none' => {
        const over = overrides.find(o => {
            const id = typeof o.permission === 'string' ? o.permission : o.permission._id;
            return id === permissionId;
        });
        return over ? over.type : 'none';
    };

    const filteredPermissions = allPermissions.filter(p =>
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );

    // Group by module
    const grouped: Record<string, { name: string, permissions: Permission[] }> = {};
    filteredPermissions.forEach(p => {
        const mod = p.module as any;
        const modId = typeof mod === 'object' ? mod._id : 'unknown';
        const modName = typeof mod === 'object' ? mod.name : 'Other';

        if (!grouped[modId]) {
            grouped[modId] = { name: modName, permissions: [] };
        }
        grouped[modId].permissions.push(p);
    });

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 600, display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)' }}>
                            <Shield size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Granular Permissions</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overrides for {userName}</p>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
                        <X size={14} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.25rem' }}>
                    {error && <div className="alert alert-error"><ShieldAlert size={14} />{error}</div>}

                    <div className="search-bar" style={{ marginBottom: '1.25rem' }}>
                        <Search size={15} className="search-icon" />
                        <input
                            className="form-input"
                            placeholder="Search permissions (e.g. users:edit)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
                                <div className="spinner" style={{ width: 24, height: 24 }} />
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading permissions system...</span>
                            </div>
                        ) : Object.keys(grouped).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                <Info size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                <p>No matching permissions found.</p>
                            </div>
                        ) : (
                            Object.entries(grouped).map(([modId, group]) => (
                                <div key={modId}>
                                    <h4 style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.75rem',
                                        letterSpacing: '0.05em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                                        {group.name}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {group.permissions.map(p => {
                                            const type = getOverrideType(p._id);
                                            const isSaving = saving === p._id;
                                            const isRoleAllowed = rolePermissionIds.includes(p._id);

                                            return (
                                                <div key={p._id} className="card" style={{
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '1rem',
                                                    background: type !== 'none' ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span className={`permission-chip chip-${p.action}`}>{p.action}</span>
                                                            <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{p.slug.split(':')[0]}</span>
                                                        </div>
                                                        {p.description && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{p.description}</p>}
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        background: 'var(--bg-primary)',
                                                        padding: '3px',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--border)',
                                                        height: 'fit-content'
                                                    }}>
                                                        <button
                                                            className={`btn btn-sm ${type === 'none' ? 'btn-secondary' : ''}`}
                                                            style={{
                                                                padding: '0.25rem 0.6rem',
                                                                fontSize: '0.7rem',
                                                                border: 'none',
                                                                background: type === 'none' 
                                                                    ? (isRoleAllowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)') 
                                                                    : 'transparent',
                                                                color: type === 'none' 
                                                                    ? (isRoleAllowed ? 'var(--success)' : 'var(--danger)') 
                                                                    : 'var(--text-muted)',
                                                                minWidth: '110px',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={() => handleToggle(p._id, type, 'none')}
                                                            disabled={isSaving}
                                                        >
                                                            {type === 'none' 
                                                                ? `Inherited: ${isRoleAllowed ? 'Allow' : 'Deny'}`
                                                                : 'Inherit'
                                                            }
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm`}
                                                            style={{
                                                                padding: '0.25rem 0.6rem',
                                                                fontSize: '0.7rem',
                                                                border: 'none',
                                                                background: type === 'allow' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                                                color: type === 'allow' ? 'var(--success)' : 'var(--text-muted)',
                                                                minWidth: '60px',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={() => handleToggle(p._id, type, 'allow')}
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving && type === 'none' ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                                            Allow
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm`}
                                                            style={{
                                                                padding: '0.25rem 0.6rem',
                                                                fontSize: '0.7rem',
                                                                border: 'none',
                                                                background: type === 'deny' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                                                color: type === 'deny' ? 'var(--danger)' : 'var(--text-muted)',
                                                                minWidth: '60px',
                                                                justifyContent: 'center'
                                                            }}
                                                            onClick={() => handleToggle(p._id, type, 'deny')}
                                                            disabled={isSaving}
                                                        >
                                                            <ShieldAlert size={12} />
                                                            Deny
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                    <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Lock size={12} />
                        Changes are saved automatically
                    </div>
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
