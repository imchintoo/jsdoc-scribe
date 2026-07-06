import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

/**
 * TODO: describe what this does.
 * @constant taskRouter
 * @type {any}
 */
export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.post("/", (req, res, next) => taskController.create(req, res, next));
taskRouter.get("/", (req, res, next) => taskController.list(req, res, next));
taskRouter.get("/overdue-summary", (req, res, next) => taskController.overdueSummary(req, res, next));
taskRouter.get("/:id", (req, res, next) => taskController.getById(req, res, next));
taskRouter.patch("/:id", (req, res, next) => taskController.update(req, res, next));
taskRouter.delete("/:id", requireRole(["admin", "owner"]), (req, res, next) => taskController.delete(req, res, next));
