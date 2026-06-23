'use client';

import { RequireView } from '@/components/PermissionGate';
import { Package } from 'lucide-react';

export default function ProductsPage() {
    return (
        <RequireView module="products">
            <div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Products</h1>
                        <p className="page-subtitle">Manage your product catalog</p>
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Products Module</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        Connect your products API to display data here. The RBAC permissions for this module are enforced.
                    </p>
                </div>
            </div>
        </RequireView>
    );
}
