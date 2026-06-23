'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RequireView, PermissionGate } from '@/components/PermissionGate';
import { User, Role } from '@/types';
import { Plus, Search, Edit, Trash2, Eye, X, Check, AlertCircle, UserPlus, Shield } from 'lucide-react';
import UserPermissionsModal from '@/components/UserPermissionsModal';

type UserWithRole = Omit<User, 'role'> & { role: Role };

interface UsersState {
    users: UserWithRole[];
    pagination: { page: number; limit: number; total: number; pages: number };
}

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', role: '', isActive: true };

export default function UsersPage() {
    const { hasPermission } = useAuth();
    const [data, setData] = useState<UsersState>({ users: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; user: UserWithRole | null }>({ open: false, mode: 'create', user: null });
    const [permModal, setPermModal] = useState<{ open: boolean; user: UserWithRole | null }>({ open: false, user: null });
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (search) params.set('search', search);
            const res = await api.get(`/users?${params}`);
            setData(res.data.data);
        } catch { }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => {
        api.get('/roles').then(res => setRoles(res.data.data || [])).catch(() => { });
    }, []);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setError('');
        setModal({ open: true, mode: 'create', user: null });
    };

    const openEdit = (user: UserWithRole) => {
        setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role._id, isActive: user.isActive });
        setError('');
        setModal({ open: true, mode: 'edit', user });
    };

    const openPermissions = (user: UserWithRole) => {
        setPermModal({ open: true, user });
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            const payload: any = { ...form };
            if (!payload.password) delete payload.password;
            if (modal.mode === 'create') {
                await api.post('/users', payload);
            } else {
                await api.put(`/users/${modal.user?._id}`, payload);
            }
            setSuccess(`User ${modal.mode === 'create' ? 'created' : 'updated'} successfully`);
            setModal({ open: false, mode: 'create', user: null });
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Operation failed');
        }
        setSaving(false);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Delete this user?')) return;
        try {
            await api.delete(`/users/${userId}`);
            setSuccess('User deleted');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <RequireView module="users">
            <div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Users</h1>
                        <p className="page-subtitle">{data.pagination.total} total users</p>
                    </div>
                    <PermissionGate module="users" action="create">
                        <button id="create-user-btn" className="btn btn-primary" onClick={openCreate}>
                            <UserPlus size={16} /> Add User
                        </button>
                    </PermissionGate>
                </div>

                {success && <div className="alert alert-success"><Check size={16} />{success}</div>}
                {error && !modal.open && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

                {/* Search */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
                        <Search size={15} className="search-icon" />
                        <input
                            id="user-search"
                            type="text"
                            className="form-input"
                            placeholder="Search users..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div className="spinner" style={{ margin: '0 auto' }} />
                                </td></tr>
                            ) : data.users.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found</td></tr>
                            ) : data.users.map(user => (
                                <tr key={user._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            <div className="avatar">{user.firstName[0]}{user.lastName[0]}</div>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td><span className="badge badge-accent">{user.role?.name || '—'}</span></td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                            <PermissionGate module="users" action="edit">
                                                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(user)} title="Edit">
                                                    <Edit size={13} />
                                                </button>
                                            </PermissionGate>
                                            <PermissionGate module="users" action="edit">
                                                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openPermissions(user)} title="Permissions">
                                                    <Shield size={13} />
                                                </button>
                                            </PermissionGate>
                                            <PermissionGate module="users" action="delete">
                                                <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(user._id)} title="Delete">
                                                    <Trash2 size={13} />
                                                </button>
                                            </PermissionGate>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {data.pagination.pages > 1 && (
                        <div className="pagination">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            {Array.from({ length: Math.min(data.pagination.pages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button className="page-btn" disabled={page === data.pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {data.pagination.total} total
                            </span>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {modal.open && (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(m => ({ ...m, open: false }))}>
                        <div className="modal">
                            <div className="modal-header">
                                <h3 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {modal.mode === 'create' ? 'Create User' : 'Edit User'}
                                </h3>
                                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setModal(m => ({ ...m, open: false }))}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-error"><AlertCircle size={14} />{error}</div>}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">First Name *</label>
                                        <input className="form-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Last Name *</label>
                                        <input className="form-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password {modal.mode === 'edit' && '(leave blank to keep)'}</label>
                                    <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={modal.mode === 'edit' ? '••••••••' : 'Min 6 characters'} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select className="form-input form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="">Select role...</option>
                                        {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Permissions Modal */}
                {permModal.open && permModal.user && (
                    <UserPermissionsModal
                        userId={permModal.user._id}
                        userName={`${permModal.user.firstName} ${permModal.user.lastName}`}
                        onClose={() => setPermModal({ open: false, user: null })}
                    />
                )}
            </div>
        </RequireView>
    );
}
