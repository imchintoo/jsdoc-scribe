import express, { Request, Response, NextFunction } from "express";
import { taskRouter } from "./routes/task.routes";
import { UnauthorizedError } from "./middleware/auth.middleware";
import { TaskNotFoundError } from "./services/task.service";

/**
 * Creates a new app.
 * @returns {any} TODO: describe the return value.
 */
export function createApp() {
    /**
 * TODO: describe what this does.
     * @constant app
     * @type {any}
     */
    const app = express();

    app.use(express.json());

    app.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok", uptime: process.uptime() });
    });

    app.use("/tasks", taskRouter);

    app.use((req: Request, res: Response) => {
        res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
    });

    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        if (err instanceof UnauthorizedError) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        if (err instanceof TaskNotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });

    return app;
}

/**
 * Main.
 */
function main(): void {
    /**
 * TODO: describe what this does.
     * @constant port
     * @type {any}
     */
    const port = Number(process.env.PORT) || 3000;
    /**
 * TODO: describe what this does.
     * @constant app
     * @type {any}
     */
    const app = createApp();
    app.listen(port, () => {
        console.log(`Task API listening on port ${port}`);
    });
}

if (require.main === module) {
    main();
}
