'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { RequireView } from '@/components/PermissionGate';
import { AuditLog } from '@/types';
import { Activity, Search, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/audit-logs?page=${page}&limit=50`);
            const { logs: data, pagination: pag } = res.data.data;
            setLogs(data);
            setPagination(pag);
        } catch { }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const actionColor: Record<string, string> = {
        LOGIN: 'badge-success', LOGOUT: 'badge-info',
        CREATE: 'badge-accent', UPDATE: 'badge-warning',
        DELETE: 'badge-danger', ASSIGN_PERMISSIONS: 'badge-warning',
    };

    return (
        <RequireView module="audit-logs">
            <div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Audit Logs</h1>
                        <p className="page-subtitle">Track all user actions across the system · {pagination.total} total records</p>
                    </div>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Resource</th>
                                <th>Status</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit logs found</td></tr>
                            ) : logs.map(log => (
                                <tr key={log._id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td>
                                        {log.user ? (
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                    {log.user.firstName} {log.user.lastName}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user.email}</div>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td><span className={`badge ${actionColor[log.action] || 'badge-info'}`}>{log.action}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{log.resource}</td>
                                    <td>
                                        {log.status === 'success'
                                            ? <span className="badge badge-success"><CheckCircle size={12} />Success</span>
                                            : <span className="badge badge-danger"><AlertCircle size={12} />Failure</span>}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} of {pagination.pages}</span>
                            <button className="page-btn" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </div>
            </div>
        </RequireView>
    );
}
