'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell, RefreshCw } from 'lucide-react';

function getBreadcrumb(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    return segments[segments.length - 1]
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export default function Header() {
    const { user, logout, refreshSidebar } = useAuth();
    const pathname = usePathname();
    const role = user?.role as any;

    return (
        <header className="header">
            {/* Breadcrumb */}
            <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {getBreadcrumb(pathname)}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Refresh sidebar */}
                <button
                    id="refresh-sidebar-btn"
                    onClick={refreshSidebar}
                    className="btn btn-secondary btn-icon"
                    title="Refresh permissions"
                >
                    <RefreshCw size={15} />
                </button>

                {/* Notification bell (UI only) */}
                <button className="btn btn-secondary btn-icon" title="Notifications">
                    <Bell size={15} />
                </button>

                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
                    <div className="avatar">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div style={{ lineHeight: 1.3 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {user?.firstName} {user?.lastName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {role?.name || 'User'}
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    id="logout-btn"
                    onClick={logout}
                    className="btn btn-danger btn-sm"
                    style={{ gap: '0.375rem' }}
                >
                    <LogOut size={14} />
                    Logout
                </button>
            </div>
        </header>
    );
}
