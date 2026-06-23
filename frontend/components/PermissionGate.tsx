'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
    module: string;
    action: 'view' | 'create' | 'edit' | 'delete';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Renders children only if the user has the required permission.
 * Optionally shows a fallback (e.g. a locked icon) or nothing.
 */
export function PermissionGate({ module, action, children, fallback }: PermissionGateProps) {
    const { hasPermission } = useAuth();
    if (hasPermission(module, action)) return <>{children}</>;
    return fallback ? <>{fallback}</> : null;
}

/**
 * Full-page access denied if user cannot view a module.
 */
export function RequireView({ module, children }: { module: string; children: React.ReactNode }) {
    const { hasPermission } = useAuth();

    if (!hasPermission(module, 'view')) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '60vh', gap: '1rem', color: 'var(--text-muted)',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Lock size={28} color="var(--danger)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Access Denied
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        You don&apos;t have permission to view this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
