import { IsString, IsOptional, IsBoolean, IsNumber, MinLength } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isSuperAdmin?: boolean;

    @IsOptional()
    @IsNumber()
    hierarchy?: number;
}

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    hierarchy?: number;
}

export class AssignPermissionsDto {
    @IsString({ each: true })
    permissionIds: string[];
}
