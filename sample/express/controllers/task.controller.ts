import type { Response, NextFunction } from "express";
import { taskService, TaskNotFoundError, TaskStatus } from "../services/task.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * Owner id of.
 * @param {AuthenticatedRequest} req - - HTTP request object.
 * @throws {Error}
 * @returns {string} TODO: describe the return value.
 */
function ownerIdOf(req: AuthenticatedRequest): string {
    if (!req.userId) throw new Error("requireAuth middleware must run before this handler");
    return req.userId;
}

/**
 * Controller managing task logic.
 */
export class TaskController {
    /**
     * Creates a new .
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant { title, dueDate }
             * @type {any}
             */
            const { title, dueDate } = req.body as { title?: string; dueDate?: string };
            if (!title || !title.trim()) {
                res.status(400).json({ error: "title is required" });
                return;
            }
            /**
 * TODO: describe what this does.
             * @constant task
             * @type {any}
             */
            const task = taskService.create({ title, ownerId: ownerIdOf(req), dueDate });
            res.status(201).json(task);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Lists the available .
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    list(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant status
             * @type {any}
             */
            const status = req.query.status as TaskStatus | undefined;
            /**
 * TODO: describe what this does.
             * @constant tasks
             * @type {any}
             */
            const tasks = taskService.listByOwner(ownerIdOf(req), status);
            res.status(200).json({ data: tasks, total: tasks.length });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Returns the by id.
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant task
             * @type {any}
             */
            const task = taskService.findById(req.params.id);
            if (task.ownerId !== ownerIdOf(req)) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            res.status(200).json(task);
        } catch (err) {
            if (err instanceof TaskNotFoundError) {
                res.status(404).json({ error: err.message });
                return;
            }
            next(err);
        }
    }

    /**
     * Updates the .
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant existing
             * @type {any}
             */
            const existing = taskService.findById(req.params.id);
            if (existing.ownerId !== ownerIdOf(req)) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            /**
 * TODO: describe what this does.
             * @constant updated
             * @type {any}
             */
            const updated = taskService.update(req.params.id, req.body);
            res.status(200).json(updated);
        } catch (err) {
            if (err instanceof TaskNotFoundError) {
                res.status(404).json({ error: err.message });
                return;
            }
            next(err);
        }
    }

    /**
     * Deletes the .
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant existing
             * @type {any}
             */
            const existing = taskService.findById(req.params.id);
            if (existing.ownerId !== ownerIdOf(req)) {
                res.status(404).json({ error: "Task not found" });
                return;
            }
            taskService.delete(req.params.id);
            res.status(204).send();
        } catch (err) {
            if (err instanceof TaskNotFoundError) {
                res.status(404).json({ error: err.message });
                return;
            }
            next(err);
        }
    }

    /**
     * Overdue summary.
     * @param {AuthenticatedRequest} req - HTTP request object.
     * @param {Response} res - HTTP response object.
     * @param {NextFunction} next - next middleware function.
     */
    overdueSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            /**
 * TODO: describe what this does.
             * @constant count
             * @type {any}
             */
            const count = taskService.countOverdue(ownerIdOf(req));
            res.status(200).json({ overdue: count });
        } catch (err) {
            next(err);
        }
    }
}

/**
 * TODO: describe what this does.
 * @constant taskController
 * @type {TaskController}
 */
export const taskController = new TaskController();
