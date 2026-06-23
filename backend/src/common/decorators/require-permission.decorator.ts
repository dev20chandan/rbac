import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

export interface PermissionRequirement {
    module: string;  // module slug, e.g. "products"
    action: 'view' | 'create' | 'edit' | 'delete';
}

export const RequirePermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete') =>
    SetMetadata(REQUIRE_PERMISSION_KEY, { module, action });
