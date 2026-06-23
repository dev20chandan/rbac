'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarItem } from '@/types';
import {
    LayoutDashboard, Users, Settings, Tag, Tags, Package,
    ShoppingCart, CreditCard, HelpCircle, FileText, Activity,
    Circle, ChevronDown, ChevronRight, Shield,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    LayoutDashboard,
    Users,
    Settings,
    Tag,
    Tags,
    Package,
    ShoppingCart,
    CreditCard,
    HelpCircle,
    FileText,
    Activity,
    Circle,
    Shield,
};

function SidebarNavItem({ item, depth = 0 }: { item: SidebarItem; depth?: number }) {
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(true);
    const Icon = ICON_MAP[item.icon] || Circle;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = pathname === item.route;
    const isParentActive = hasChildren && item.children.some(child => pathname.startsWith(child.route));

    return (
        <div>
            <Link
                href={hasChildren ? '#' : item.route}
                className={`nav-item ${isActive || (!hasChildren && isParentActive) ? 'active' : ''}`}
                style={{ paddingLeft: depth > 0 ? `${0.875 + depth * 0.75}rem` : undefined }}
                onClick={hasChildren ? (e) => { e.preventDefault(); setExpanded(!expanded); } : undefined}
            >
                <Icon size={16} className="icon" />
                <span style={{ flex: 1 }}>{item.name}</span>
                {hasChildren && (
                    expanded
                        ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                )}
            </Link>

            {hasChildren && expanded && (
                <div className="nav-children">
                    {item.children.map(child => (
                        <SidebarNavItem key={child._id} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const { sidebar, user } = useAuth();
    const role = user?.role as any;

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--accent), #818cf8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Shield size={16} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        RBAC Admin
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Access Control Panel
                    </div>
                </div>
            </div>

            {/* Role badge */}
            {role && (
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div>
                                <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                    {role?.name || 'User'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {sidebar.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                        No accessible modules
                    </div>
                ) : (
                    sidebar.map(item => (
                        <SidebarNavItem key={item._id} item={item} />
                    ))
                )}
            </nav>

            {/* Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                RBAC v1.0 · Built with NestJS + Next.js
            </div>
        </aside>
    );
}
