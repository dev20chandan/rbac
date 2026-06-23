'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, SidebarItem, AuthState } from '@/types';

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (module: string, action: string) => boolean;
    refreshSidebar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: true,
        permissions: [],
        sidebar: [],
    });

    const fetchSidebar = useCallback(async () => {
        try {
            const res = await api.get('/sidebar');
            return res.data.data as SidebarItem[];
        } catch {
            return [];
        }
    }, []);

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await api.get('/permissions/my');
            return res.data.data as string[];
        } catch {
            return [];
        }
    }, []);

    const refreshSidebar = useCallback(async () => {
        const [sidebar, permissions] = await Promise.all([fetchSidebar(), fetchPermissions()]);
        setState(prev => ({ ...prev, sidebar, permissions }));
    }, [fetchSidebar, fetchPermissions]);

    // Bootstrap: restore session from localStorage
    useEffect(() => {
        const bootstrap = async () => {
            const token = localStorage.getItem('accessToken');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                setState(prev => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                const res = await api.get('/auth/me');
                const user = res.data.data as User;
                const [sidebar, permissions] = await Promise.all([fetchSidebar(), fetchPermissions()]);

                setState({
                    user,
                    accessToken: token,
                    isAuthenticated: true,
                    isLoading: false,
                    permissions,
                    sidebar,
                });
            } catch {
                localStorage.clear();
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        bootstrap();
    }, [fetchSidebar, fetchPermissions]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { user, accessToken } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userId', user._id);

        const [sidebar, permissions] = await Promise.all([fetchSidebar(), fetchPermissions()]);

        setState({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            permissions,
            sidebar,
        });

        router.push('/dashboard');
    }, [router, fetchSidebar, fetchPermissions]);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore */ }

        localStorage.clear();
        setState({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            permissions: [],
            sidebar: [],
        });
        router.push('/login');
    }, [router]);

    const hasPermission = useCallback((module: string, action: string): boolean => {
        if (!state.isAuthenticated) return false;
        // Super Admin check via role
        const role = state.user?.role as any;
        if (role?.isSuperAdmin) return true;
        return state.permissions.includes(`${module}:${action}`);
    }, [state.permissions, state.isAuthenticated, state.user]);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasPermission, refreshSidebar }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
