'use client';
import { RequireView } from '@/components/PermissionGate';
import { Tag } from 'lucide-react';
export default function CategoriesPage() {
    return (
        <RequireView module="categories">
            <div>
                <div className="page-header"><div><h1 className="page-title">Categories</h1><p className="page-subtitle">Manage product categories</p></div></div>
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <Tag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Categories Module</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>RBAC-protected. Connect your categories API.</p>
                </div>
            </div>
        </RequireView>
    );
}
