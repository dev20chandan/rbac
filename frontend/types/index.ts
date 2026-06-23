// Types for the RBAC application

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role | string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Role {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    isSuperAdmin: boolean;
    isActive: boolean;
    hierarchy: number;
    createdAt: string;
}

export interface Permission {
    _id: string;
    module: AppModule | string;
    action: 'view' | 'create' | 'edit' | 'delete';
    slug: string;
    description?: string;
}

export interface AppModule {
    _id: string;
    name: string;
    slug: string;
    route: string;
    icon: string;
    parent: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface SidebarItem {
    _id: string;
    name: string;
    slug: string;
    route: string;
    icon: string;
    sortOrder: number;
    permissions: string[];
    children: SidebarItem[];
}

export interface AuditLog {
    _id: string;
    user: { firstName: string; lastName: string; email: string };
    action: string;
    resource: string;
    resourceId?: string;
    status: 'success' | 'failure';
    ipAddress?: string;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

export interface PaginationResult<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: string[];
    sidebar: SidebarItem[];
}
