/**
 * TODO: describe what this does.
 * @typedef {"pending" | "in-progress" | "done"} TaskStatus
 */
export type TaskStatus = "pending" | "in-progress" | "done";

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} id
 * @property {string} title
 * @property {TaskStatus} status
 * @property {string} ownerId
 * @property {Date | null} dueDate
 * @property {Date} createdAt
 */
export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    ownerId: string;
    dueDate: Date | null;
    createdAt: Date;
}

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} title
 * @property {string} ownerId
 * @property {string} dueDate
 */
export interface CreateTaskInput {
    title: string;
    ownerId: string;
    dueDate?: string;
}

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} title
 * @property {TaskStatus} status
 * @property {string | null} dueDate
 */
export interface UpdateTaskInput {
    title?: string;
    status?: TaskStatus;
    dueDate?: string | null;
}

/**
 * TODO: describe what this does.
 * @variable seq
 * @type {number}
 */
let seq = 0;

/**
 * Next id.
 * @returns {string} TODO: describe the return value.
 */
function nextId(): string {
    seq += 1;
    return `task_${seq}`;
}

/**
 * Error thrown when task not found related issues occur.
 * @extends Error
 */
export class TaskNotFoundError extends Error {
    /**
     * TODO: describe what this does.
     * @param {string} id - - unique identifier.
     * @constructor
     */
    constructor(id: string) {
        super(`Task not found: ${id}`);
        this.name = "TaskNotFoundError";
    }
}

/**
 * Service responsible for task operations.
 */
export class TaskService {
    /**
 * TODO: describe what this does.
     * @member tasks
     * @type {Map}
     * @private
     */
    private tasks = new Map<string, Task>();

    /**
     * Creates a new .
     * @param {CreateTaskInput} input - - input value.
     * @returns {Task} TODO: describe the return value.
     */
    create(input: CreateTaskInput): Task {
        /**
 * TODO: describe what this does.
         * @constant task
         * @type {Task}
         */
        const task: Task = {
            id: nextId(),
            title: input.title.trim(),
            status: "pending",
            ownerId: input.ownerId,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            createdAt: new Date(),
        };
        this.tasks.set(task.id, task);
        return task;
    }

    /**
     * Finds the by id.
     * @param {string} id - - unique identifier.
     * @throws {TaskNotFoundError}
     * @returns {Task} TODO: describe the return value.
     */
    findById(id: string): Task {
        /**
 * TODO: describe what this does.
         * @constant task
         * @type {any}
         */
        const task = this.tasks.get(id);
        if (!task) throw new TaskNotFoundError(id);
        return task;
    }

    /**
     * Lists the available by owner.
     * @param {string} ownerId - - owner unique identifier.
     * @param {TaskStatus} [status] - - status.
     * @returns {Task[]} TODO: describe the return value.
     */
    listByOwner(ownerId: string, status?: TaskStatus): Task[] {
        return [...this.tasks.values()]
            .filter((t) => t.ownerId === ownerId)
            .filter((t) => (status ? t.status === status : true))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    /**
     * Updates the .
     * @param {string} id - - unique identifier.
     * @param {UpdateTaskInput} input - - input value.
     * @returns {Task} TODO: describe the return value.
     */
    update(id: string, input: UpdateTaskInput): Task {
        /**
 * TODO: describe what this does.
         * @constant task
         * @type {any}
         */
        const task = this.findById(id);
        if (input.title !== undefined) task.title = input.title.trim();
        if (input.status !== undefined) task.status = input.status;
        if (input.dueDate !== undefined) {
            task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        }
        this.tasks.set(id, task);
        return task;
    }

    /**
     * Deletes the .
     * @param {string} id - unique identifier.
     * @throws {TaskNotFoundError}
     */
    delete(id: string): void {
        if (!this.tasks.has(id)) throw new TaskNotFoundError(id);
        this.tasks.delete(id);
    }

    /**
     * Returns the count of overdue.
     * @param {string} ownerId - - owner unique identifier.
     * @returns {number} TODO: describe the return value.
     */
    countOverdue(ownerId: string): number {
        /**
 * TODO: describe what this does.
         * @constant now
         * @type {any}
         */
        const now = Date.now();
        return this.listByOwner(ownerId).filter(
            (t) => t.status !== "done" && t.dueDate !== null && t.dueDate.getTime() < now,
        ).length;
    }
}

/**
 * TODO: describe what this does.
 * @constant taskService
 * @type {TaskService}
 */
export const taskService = new TaskService();
