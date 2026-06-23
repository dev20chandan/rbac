'use client';

import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if the current user has a specific permission.
 * Usage: const canCreate = usePermission('products', 'create');
 */
export function usePermission(module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    const { hasPermission } = useAuth();
    return hasPermission(module, action);
}

/**
 * Hook to get all permissions for a specific module.
 * Returns an object: { view, create, edit, delete }
 */
export function useModulePermissions(module: string) {
    const { hasPermission } = useAuth();
    return {
        canView: hasPermission(module, 'view'),
        canCreate: hasPermission(module, 'create'),
        canEdit: hasPermission(module, 'edit'),
        canDelete: hasPermission(module, 'delete'),
    };
}
