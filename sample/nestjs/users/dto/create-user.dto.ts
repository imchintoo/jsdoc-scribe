import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "../entities/user.entity";

/**
 * Data transfer object for create user.
 */
export class CreateUserDto {
    /**
 * TODO: describe what this does.
     * @member email
     * @type {string}
     * @public
     */
    @IsEmail()
    email!: string;

    /**
 * TODO: describe what this does.
     * @member displayName
     * @type {string}
     * @public
     */
    @IsString()
    @MinLength(2)
    displayName!: string;

    /**
 * TODO: describe what this does.
     * @member role
     * @type {UserRole}
     * @public
     */
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

/**
 * Data transfer object for update user.
 */
export class UpdateUserDto {
    /**
 * TODO: describe what this does.
     * @member displayName
     * @type {string}
     * @public
     */
    @IsOptional()
    @IsString()
    @MinLength(2)
    displayName?: string;

    /**
 * TODO: describe what this does.
     * @member role
     * @type {UserRole}
     * @public
     */
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
