import { IsMongoId, IsEnum } from 'class-validator';

export class OverrideUserPermissionDto {
    @IsMongoId()
    permissionId: string;

    @IsEnum(['allow', 'deny'])
    type: 'allow' | 'deny';
}
