'use client';
import { RequireView } from '@/components/PermissionGate';
import { CreditCard } from 'lucide-react';
export default function PaymentsPage() {
    return (
        <RequireView module="payments">
            <div>
                <div className="page-header"><div><h1 className="page-title">Payments</h1><p className="page-subtitle">Manage payment transactions</p></div></div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <CreditCard size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Payments Module</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>RBAC-protected. Connect your payments API.</p>
                </div>
            </div>
        </RequireView>
    );
}
