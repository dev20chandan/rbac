import {
    IsString, IsOptional, IsBoolean, IsNumber, IsMongoId,
} from 'class-validator';

export class CreateModuleDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    route: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsMongoId()
    parent?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateModuleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    route?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsMongoId()
    parent?: string;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
