import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, HttpCode } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto } from "./dto/create-user.dto";
import { UserEntity, UserRole } from "./entities/user.entity";
import { RolesGuard } from "../auth/roles.guard";

/**
 * Controller managing users logic.
 */
@Controller("users")
export class UsersController {
    /**
     * TODO: describe what this does.
     * @param {UsersService} usersService - - users service instance.
     * @constructor
     */
    constructor(private readonly usersService: UsersService) {}

    /**
     * Creates a new .
     * @param {CreateUserDto} dto - - dto.
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    @Post()
    async create(@Body() dto: CreateUserDto): Promise<UserEntity> {
        return this.usersService.create(dto);
    }

    /**
     * Finds the all.
     * @param {UserRole} [role] - - user role identifier.
     * @returns {Promise<UserEntity[]>} TODO: describe the return value.
     * @async
     */
    @Get()
    async findAll(@Query("role") role?: UserRole): Promise<UserEntity[]> {
        return this.usersService.findAll(role);
    }

    /**
     * Stats by role.
     * @returns {Promise<Record<UserRole, number>>} TODO: describe the return value.
     * @async
     */
    @Get("stats/by-role")
    async statsByRole(): Promise<Record<UserRole, number>> {
        return this.usersService.countByRole();
    }

    /**
     * Finds the one.
     * @param {string} id - - unique identifier.
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    @Get(":id")
    async findOne(@Param("id") id: string): Promise<UserEntity> {
        return this.usersService.findOne(id);
    }

    /**
     * Updates the .
     * @param {string} id - - unique identifier.
     * @param {UpdateUserDto} dto - - dto.
     * @returns {Promise<UserEntity>} TODO: describe the return value.
     * @async
     */
    @Patch(":id")
    @UseGuards(RolesGuard)
    async update(@Param("id") id: string, @Body() dto: UpdateUserDto): Promise<UserEntity> {
        return this.usersService.update(id, dto);
    }

    /**
     * Removes the .
     * @param {string} id - - unique identifier.
     * @returns {Promise<void>} TODO: describe the return value.
     * @async
     */
    @Delete(":id")
    @HttpCode(204)
    @UseGuards(RolesGuard)
    async remove(@Param("id") id: string): Promise<void> {
        await this.usersService.remove(id);
    }
}
