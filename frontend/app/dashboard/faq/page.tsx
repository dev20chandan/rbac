'use client';
import { RequireView } from '@/components/PermissionGate';
import { HelpCircle } from 'lucide-react';
export default function FaqPage() {
    return (
        <RequireView module="faq">
            <div>
                <div className="page-header"><div><h1 className="page-title">FAQ</h1><p className="page-subtitle">Manage frequently asked questions</p></div></div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <HelpCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>FAQ Module</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>RBAC-protected. Connect your FAQ API.</p>
                </div>
            </div>
        </RequireView>
    );
}
