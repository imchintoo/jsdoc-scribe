/**
 * TODO: describe what this does.
 * @enum UserRole
 * @values Member | Admin
 */
export enum UserRole {
    Member = "member",
    Admin = "admin",
}

/**
 * Domain entity representing user.
 */
export class UserEntity {
    /**
 * TODO: describe what this does.
     * @member id
     * @type {string}
     * @public
     */
    id: string;
    /**
 * TODO: describe what this does.
     * @member email
     * @type {string}
     * @public
     */
    email: string;
    /**
 * TODO: describe what this does.
     * @member displayName
     * @type {string}
     * @public
     */
    displayName: string;
    /**
 * TODO: describe what this does.
     * @member role
     * @type {UserRole}
     * @public
     */
    role: UserRole;
    /**
 * TODO: describe what this does.
     * @member createdAt
     * @type {Date}
     * @public
     */
    createdAt: Date;

    /**
     * TODO: describe what this does.
     * @param {Partial<UserEntity>} partial - - partial.
     * @constructor
     */
    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }

    /**
     * Returns the is admin.
     * @returns {boolean}
     */
    get isAdmin(): boolean {
        return this.role === UserRole.Admin;
    }

    /**
     * To public.
     * @returns {Omit<UserEntity, "toPublic" | "isAdmin">} TODO: describe the return value.
     */
    toPublic(): Omit<UserEntity, "toPublic" | "isAdmin"> {
        /**
 * TODO: describe what this does.
         * @constant { id, email, displayName, role, createdAt }
         * @type {any}
         */
        const { id, email, displayName, role, createdAt } = this;
        return { id, email, displayName, role, createdAt };
    }
}
