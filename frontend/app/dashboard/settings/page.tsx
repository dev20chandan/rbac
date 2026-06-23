'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { RequireView, PermissionGate } from '@/components/PermissionGate';
import { Role, Permission } from '@/types';
import { Plus, Edit, Trash2, Key, X, AlertCircle, Check, Shield } from 'lucide-react';

interface PermissionWithModule {
    _id: string;
    action: 'view' | 'create' | 'edit' | 'delete';
    slug: string;
    description?: string;
    module: { _id: string; name: string; slug: string };
}

export default function SettingsPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<PermissionWithModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; role: Role | null }>({ open: false, mode: 'create', role: null });
    const [form, setForm] = useState({ name: '', slug: '', description: '', hierarchy: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [permSearch, setPermSearch] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.allSettled([api.get('/roles'), api.get('/permissions')]);
        if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.data.data || []);
        if (permsRes.status === 'fulfilled') setPermissions(permsRes.value.data.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchRolePermissions = async (role: Role) => {
        setSelectedRole(role);
        try {
            const res = await api.get(`/roles/${role._id}/permissions`);
            const perms = res.data.data as PermissionWithModule[];
            setRolePermissions(perms.map(p => p._id));
        } catch { setRolePermissions([]); }
    };

    const saveRolePermissions = async () => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            await api.put(`/roles/${selectedRole._id}/permissions`, { permissionIds: rolePermissions });
            setSuccess('Permissions saved!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save');
        }
        setSaving(false);
    };

    const openCreate = () => {
        setForm({ name: '', slug: '', description: '', hierarchy: 0 });
        setError('');
        setModal({ open: true, mode: 'create', role: null });
    };

    const openEdit = (role: Role) => {
        setForm({ name: role.name, slug: role.slug, description: role.description || '', hierarchy: role.hierarchy });
        setError('');
        setModal({ open: true, mode: 'edit', role });
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            if (modal.mode === 'create') {
                await api.post('/roles', form);
            } else {
                const { slug: _, ...updateData } = form;
                await api.put(`/roles/${modal.role?._id}`, updateData);
            }
            setSuccess(`Role ${modal.mode === 'create' ? 'created' : 'updated'}`);
            setModal({ open: false, mode: 'create', role: null });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Operation failed');
        }
        setSaving(false);
    };

    const handleDelete = async (roleId: string) => {
        if (!confirm('Delete this role?')) return;
        try {
            await api.delete(`/roles/${roleId}`);
            setSuccess('Role deleted');
            fetchData();
            if (selectedRole?._id === roleId) setSelectedRole(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Delete failed');
        }
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce<Record<string, PermissionWithModule[]>>((acc, p) => {
        const key = typeof p.module === 'object' ? p.module.name : String(p.module);
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const filteredGroups = Object.entries(groupedPermissions).filter(([name]) =>
        !permSearch || name.toLowerCase().includes(permSearch.toLowerCase())
    );

    const togglePerm = (permId: string) => {
        setRolePermissions(prev =>
            prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
        );
    };

    const toggleAllForModule = (perms: PermissionWithModule[]) => {
        const ids = perms.map(p => p._id);
        const allSelected = ids.every(id => rolePermissions.includes(id));
        if (allSelected) {
            setRolePermissions(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setRolePermissions(prev => [...new Set([...prev, ...ids])]);
        }
    };

    return (
        <RequireView module="settings">
            <div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Roles & Permissions</h1>
                        <p className="page-subtitle">Manage roles and assign permissions</p>
                    </div>
                </div>

                {success && <div className="alert alert-success"><Check size={16} />{success}</div>}
                {error && !modal.open && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    {(['roles', 'permissions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="btn"
                            style={{
                                background: activeTab === tab ? 'var(--accent-glow)' : 'transparent',
                                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                                border: activeTab === tab ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab === 'roles' ? <Shield size={15} /> : <Key size={15} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === 'roles' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Roles list */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Roles</h3>
                                <PermissionGate module="settings" action="create">
                                    <button className="btn btn-primary btn-sm" onClick={openCreate}>
                                        <Plus size={14} /> New
                                    </button>
                                </PermissionGate>
                            </div>
                            {loading ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                            ) : (
                                roles.map(role => (
                                    <div
                                        key={role._id}
                                        onClick={() => fetchRolePermissions(role)}
                                        style={{
                                            padding: '0.875rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            background: selectedRole?._id === role._id ? 'var(--accent-glow)' : 'transparent',
                                            borderLeft: selectedRole?._id === role._id ? '3px solid var(--accent)' : '3px solid transparent',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{role.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role.description || role.slug}</div>
                                                {role.isSuperAdmin && <span className="badge badge-accent" style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Super Admin</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                                                {!role.isSuperAdmin && (
                                                    <>
                                                        <PermissionGate module="settings" action="edit">
                                                            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(role)}>
                                                                <Edit size={12} />
                                                            </button>
                                                        </PermissionGate>
                                                        <PermissionGate module="settings" action="delete">
                                                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(role._id)}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </PermissionGate>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Permission assignment */}
                        <div className="card" style={{ padding: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    {selectedRole ? `Permissions → ${selectedRole.name}` : 'Select a role'}
                                </h3>
                                {selectedRole && !selectedRole.isSuperAdmin && (
                                    <PermissionGate module="settings" action="edit">
                                        <button className="btn btn-primary btn-sm" onClick={saveRolePermissions} disabled={saving}>
                                            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                                            Save
                                        </button>
                                    </PermissionGate>
                                )}
                            </div>

                            {!selectedRole ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Shield size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                                    <p>Click a role to manage its permissions</p>
                                </div>
                            ) : selectedRole.isSuperAdmin ? (
                                <div style={{ padding: '2rem' }}>
                                    <div className="alert alert-success"><Check size={16} />Super Admin has all permissions by default</div>
                                </div>
                            ) : (
                                <div style={{ padding: '1rem' }}>
                                    <input
                                        className="form-input"
                                        placeholder="Search modules..."
                                        value={permSearch}
                                        onChange={e => setPermSearch(e.target.value)}
                                        style={{ marginBottom: '1rem' }}
                                    />
                                    <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                        {filteredGroups.map(([moduleName, perms]) => {
                                            const allSelected = perms.every(p => rolePermissions.includes(p._id));
                                            return (
                                                <div key={moduleName} style={{ marginBottom: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{moduleName}</span>
                                                        <button
                                                            className={`btn btn-sm ${allSelected ? 'btn-success' : 'btn-secondary'}`}
                                                            onClick={() => toggleAllForModule(perms)}
                                                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                                        >
                                                            {allSelected ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {perms.map(perm => (
                                                            <label key={perm._id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', padding: '0.3rem 0.625rem', borderRadius: 6, background: rolePermissions.includes(perm._id) ? 'var(--accent-glow)' : 'var(--bg-card)', border: `1px solid ${rolePermissions.includes(perm._id) ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                                                                <input type="checkbox" checked={rolePermissions.includes(perm._id)} onChange={() => togglePerm(perm._id)} style={{ display: 'none' }} />
                                                                <span className={`permission-chip chip-${perm.action}`}>{perm.action}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Permissions list */
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr><th>Slug</th><th>Module</th><th>Action</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                {permissions.map(p => (
                                    <tr key={p._id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.8rem' }}>{p.slug}</td>
                                        <td>{typeof p.module === 'object' ? p.module.name : p.module}</td>
                                        <td><span className={`permission-chip chip-${p.action}`}>{p.action}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.description || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Role Modal */}
                {modal.open && (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(m => ({ ...m, open: false }))}>
                        <div className="modal">
                            <div className="modal-header">
                                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{modal.mode === 'create' ? 'Create Role' : 'Edit Role'}</h3>
                                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(m => ({ ...m, open: false }))}><X size={14} /></button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: modal.mode === 'create' ? e.target.value.toLowerCase().replace(/\s+/g, '-') : f.slug }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Slug *</label>
                                    <input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} disabled={modal.mode === 'edit'} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hierarchy (lower = higher privilege)</label>
                                    <input className="form-input" type="number" value={form.hierarchy} onChange={e => setForm(f => ({ ...f, hierarchy: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RequireView>
    );
}
