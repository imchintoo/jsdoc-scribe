import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { UserRole } from "../users/entities/user.entity";

/**
 * TODO: describe what this does.
 * @interface
 * @property {Record<string, string | undefined>} headers
 */
interface RequestWithRole {
    headers: Record<string, string | undefined>;
}

/**
 * Represents a roles guard.
 * @implements CanActivate
 */
@Injectable()
export class RolesGuard implements CanActivate {
    /**
     * Returns whether the activate is permitted.
     * @param {ExecutionContext} context - - execution context.
     * @throws {ForbiddenException}
     * @returns {boolean} TODO: describe the return value.
     */
    canActivate(context: ExecutionContext): boolean {
        /**
 * TODO: describe what this does.
         * @constant request
         * @type {any}
         */
        const request = context.switchToHttp().getRequest<RequestWithRole>();
        /**
 * TODO: describe what this does.
         * @constant role
         * @type {any}
         */
        const role = request.headers["x-user-role"];
        if (role !== UserRole.Admin) {
            throw new ForbiddenException("This action requires the admin role");
        }
        return true;
    }
}
