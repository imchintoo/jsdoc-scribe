import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { UserEntity, UserRole } from "./entities/user.entity";
import { CreateUserDto, UpdateUserDto } from "./dto/create-user.dto";

/**
 * Service responsible for users operations.
 */
@Injectable()
export class UsersService {
    /**
 * TODO: describe what this does.
     * @member users
     * @type {Map}
     * @private
     * @readonly
     */
    private readonly users = new Map<string, UserEntity>();
    /**
 * TODO: describe what this does.
     * @member seq
     * @type {number}
     * @private
     */
    private seq = 0;

    /**
     * Creates a new .
     * @param {CreateUserDto} dto - - dto.
     * @throws {ConflictException}
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    async create(dto: CreateUserDto): Promise<UserEntity> {
        /**
 * TODO: describe what this does.
         * @constant existing
         * @type {any}
         */
        const existing = [...this.users.values()].find((u) => u.email === dto.email);
        if (existing) {
            throw new ConflictException(`A user with email "${dto.email}" already exists`);
        }
        this.seq += 1;
        /**
 * TODO: describe what this does.
         * @constant user
         * @type {UserEntity}
         */
        const user = new UserEntity({
            id: `user_${this.seq}`,
            email: dto.email,
            displayName: dto.displayName,
            role: dto.role ?? UserRole.Member,
            createdAt: new Date(),
        });
        this.users.set(user.id, user);
        return user;
    }

    /**
     * Finds the all.
     * @param {UserRole} [role] - - user role identifier.
     * @returns {Promise<UserEntity[]>} TODO: describe the return value.
     * @async
     */
    async findAll(role?: UserRole): Promise<UserEntity[]> {
        /**
 * TODO: describe what this does.
         * @constant all
         * @type {Array}
         */
        const all = [...this.users.values()];
        return role ? all.filter((u) => u.role === role) : all;
    }

    /**
     * Finds the one.
     * @param {string} id - - unique identifier.
     * @throws {NotFoundException}
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    async findOne(id: string): Promise<UserEntity> {
        /**
 * TODO: describe what this does.
         * @constant user
         * @type {any}
         */
        const user = this.users.get(id);
        if (!user) throw new NotFoundException(`User ${id} not found`);
        return user;
    }

    /**
     * Updates the .
     * @param {string} id - - unique identifier.
     * @param {UpdateUserDto} dto - - dto.
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
        /**
 * TODO: describe what this does.
         * @constant user
         * @type {any}
         */
        const user = await this.findOne(id);
        if (dto.displayName !== undefined) user.displayName = dto.displayName;
        if (dto.role !== undefined) user.role = dto.role;
        this.users.set(id, user);
        return user;
    }

    /**
     * Removes the .
     * @param {string} id - - unique identifier.
     * @throws {NotFoundException}
     * @returns {Promise<void>} TODO: describe the return value.
     * @async
     */
    async remove(id: string): Promise<void> {
        /**
 * TODO: describe what this does.
         * @constant existed
         * @type {any}
         */
        const existed = this.users.delete(id);
        if (!existed) throw new NotFoundException(`User ${id} not found`);
    }

    /**
     * Returns the count of by role.
     * @returns {Promise<Record<UserRole, number>>} TODO: describe the return value.
     * @async
     */
    async countByRole(): Promise<Record<UserRole, number>> {
        /**
 * TODO: describe what this does.
         * @constant counts
         * @type {any}
         */
        const counts = { [UserRole.Member]: 0, [UserRole.Admin]: 0 } as Record<UserRole, number>;
        for (const user of this.users.values()) counts[user.role] += 1;
        return counts;
    }
}
