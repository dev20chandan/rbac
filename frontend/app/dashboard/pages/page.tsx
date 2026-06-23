'use client';
import { RequireView } from '@/components/PermissionGate';
import { FileText } from 'lucide-react';
export default function PagesPage() {
    return (
        <RequireView module="pages">
            <div>
                <div className="page-header"><div><h1 className="page-title">Pages</h1><p className="page-subtitle">Manage CMS pages</p></div></div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Pages Module</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>RBAC-protected. Connect your pages/CMS API.</p>
                </div>
            </div>
        </RequireView>
    );
}
