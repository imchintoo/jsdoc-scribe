/**
 * @module middleware
 * @description Composable, typed middleware pipeline inspired by Koa/Express.
 * Handlers receive a mutable context object and a `next()` function to invoke the
 * remaining chain. Supports async handlers, error-handling middleware, and timeouts.
 * @since 1.6.0
 */

import type { AppError } from "./errors";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Core request context threaded through the middleware chain.
 * Extend this interface (via declaration merging) to add app-specific fields.
 */
export interface Context {
    /** Incoming HTTP method (GET, POST, etc.). */
    method: string;
    /** Request URL path. */
    path: string;
    /** Parsed query parameters. */
    query: Record<string, string>;
    /** Request body (pre-parsed). */
    body: unknown;
    /** Response state accumulated by middleware. */
    response: {
        status: number;
        body: unknown;
        headers: Record<string, string>;
    };
    /** Arbitrary key/value bag for passing data between middleware. */
    state: Record<string, unknown>;
    /** ISO timestamp of when the request entered the pipeline. */
    startedAt: string;
}

/**
 * A middleware function. Call `next()` to invoke the next handler in the chain.
 * @template C - Context type (extends Context).
 */
export type Middleware<C extends Context = Context> = (
    ctx: C,
    next: () => Promise<void>
) => Promise<void> | void;

/**
 * An error-handling middleware. Receives the thrown error as a first argument.
 * @template C - Context type.
 */
export type ErrorMiddleware<C extends Context = Context> = (
    err: unknown,
    ctx: C,
    next: () => Promise<void>
) => Promise<void> | void;

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Composes an ordered array of middleware functions into a single callable.
 * Handlers run in array order; each must call `next()` to proceed.
 *
 * @param middlewares - Ordered middleware functions.
 * @returns A composed function accepting context and an optional final handler.
 * @since 1.6.0
 *
 * @example
 * const run = compose([logger, authenticate, authorize]);
 * await run(ctx);
 */
export function compose<C extends Context>(
    middlewares: Middleware<C>[]
): (ctx: C, final?: () => Promise<void>) => Promise<void> {
    return async function (ctx: C, final?: () => Promise<void>): Promise<void> {
        /**
 * TODO: describe what this does.
         * @variable index
         * @type {any}
         */
        let index = -1;
        /**
         * TODO: describe what this does.
         * @param {number} i - TODO: describe parameter "i".
         * @returns {Promise<void>} TODO: describe the return value.
         * @function dispatch
         * @async
         */
        async function dispatch(i: number): Promise<void> {
            if (i <= index) throw new Error("next() called multiple times");
            index = i;
            /**
 * TODO: describe what this does.
             * @constant fn
             * @type {any}
             */
            const fn = i < middlewares.length ? middlewares[i] : final;
            if (!fn) return;
            await fn(ctx, () => dispatch(i + 1));
        }
        await dispatch(0);
    };
}

// ─── Pipeline class ──────────────────────────────────────────────────────────

/**
 * Object-oriented wrapper around `compose()`.
 * Register middleware with `use()`, error handlers with `catch()`, then execute with `run()`.
 *
 * @example
 * const pipeline = new Pipeline<Context>()
 *   .use(loggerMiddleware)
 *   .use(authMiddleware)
 *   .catch(errorHandler);
 *
 * await pipeline.run(ctx);
 * @since 1.6.0
 */
export class Pipeline<C extends Context = Context> {
    /**
 * TODO: describe what this does.
     * @member _middlewares
     * @type {Middleware<C>[]}
     * @private
     */
    private _middlewares: Middleware<C>[] = [];
    /**
 * TODO: describe what this does.
     * @member _errorHandlers
     * @type {ErrorMiddleware<C>[]}
     * @private
     */
    private _errorHandlers: ErrorMiddleware<C>[] = [];

    /**
     * Appends a middleware to the end of the chain.
     * @param fn - Middleware function to append.
     * @returns `this` for chaining.
     * @since 1.6.0
     */
    use(fn: Middleware<C>): this {
        this._middlewares.push(fn);
        return this;
    }

    /**
     * Registers an error-handling middleware.
     * Error handlers run when any regular middleware throws.
     * @param fn - Error handler function.
     * @returns `this` for chaining.
     * @since 1.6.0
     */
    catch(fn: ErrorMiddleware<C>): this {
        this._errorHandlers.push(fn);
        return this;
    }

    /**
     * Returns the number of registered regular middleware functions.
     * @returns Middleware count.
     */
    get size(): number { return this._middlewares.length; }

    /**
     * Executes the middleware chain with the given context.
     * If a middleware throws and error handlers are registered, they run in order.
     *
     * @param ctx - Mutable request context.
     * @returns Promise that resolves when the chain completes.
     * @throws {unknown} Re-throws if no error handlers are registered or all re-throw.
     * @since 1.6.0
     */
    async run(ctx: C): Promise<void> {
        /**
 * TODO: describe what this does.
         * @constant composed
         * @type {any}
         */
        const composed = compose(this._middlewares);
        try {
            await composed(ctx);
        } catch (err) {
            if (!this._errorHandlers.length) throw err;
            /**
 * TODO: describe what this does.
             * @variable i
             * @type {any}
             */
            let i = -1;
            /**
             * TODO: describe what this does.
             * @param {number} j - TODO: describe parameter "j".
             * @returns {Promise<void>} TODO: describe the return value.
             * @function dispatch
             * @async
             */
            const dispatch = async (j: number): Promise<void> => {
                if (j <= i) throw new Error("next() called multiple times in error handler");
                i = j;
                /**
 * TODO: describe what this does.
                 * @constant fn
                 * @type {any}
                 */
                const fn = this._errorHandlers[j];
                if (!fn) return;
                await fn(err, ctx, () => dispatch(j + 1));
            };
            await dispatch(0);
        }
    }

    /**
     * Creates a shallow clone of this pipeline (same middleware references, new arrays).
     * Useful for creating per-request pipeline instances.
     * @returns A new Pipeline with the same middleware.
     * @since 1.6.0
     */
    clone(): Pipeline<C> {
        /**
 * TODO: describe what this does.
         * @constant p
         * @type {Pipeline}
         */
        const p = new Pipeline<C>();
        p._middlewares = [...this._middlewares];
        p._errorHandlers = [...this._errorHandlers];
        return p;
    }
}

// ─── Built-in middleware ──────────────────────────────────────────────────────

/**
 * Logs method, path, status, and elapsed time on each request.
 * Writes to the provided logger (default: console).
 *
 * @param logger - Object with an `info` method (default: console).
 * @returns Middleware function.
 * @since 1.6.0
 */
export function requestLogger(
    logger: { info: (msg: string) => void } = console
): Middleware {
    return async (ctx, next) => {
        /**
 * TODO: describe what this does.
         * @constant start
         * @type {any}
         */
        const start = Date.now();
        await next();
        /**
 * TODO: describe what this does.
         * @constant ms
         * @type {any}
         */
        const ms = Date.now() - start;
        logger.info(`${ctx.method} ${ctx.path} ${ctx.response.status} ${ms}ms`);
    };
}

/**
 * Adds `X-Response-Time` header with the elapsed time in milliseconds.
 * @returns Middleware function.
 * @since 1.6.0
 */
export function responseTime(): Middleware {
    return async (ctx, next) => {
        /**
 * TODO: describe what this does.
         * @constant start
         * @type {any}
         */
        const start = Date.now();
        await next();
        ctx.response.headers["X-Response-Time"] = `${Date.now() - start}ms`;
    };
}

/**
 * Aborts the pipeline with a 408 Request Timeout if `next()` doesn't resolve within `ms`.
 *
 * @param ms - Timeout in milliseconds.
 * @returns Middleware function.
 * @throws {AppError} 408 timeout error if the deadline is exceeded.
 * @since 1.6.0
 */
export function timeout(ms: number): Middleware {
    return async (ctx, next) => {
        /**
 * TODO: describe what this does.
         * @variable timer
         * @type {ReturnType<typeof setTimeout>}
         */
        let timer: ReturnType<typeof setTimeout>;
        /**
 * TODO: describe what this does.
         * @constant deadline
         * @type {Promise}
         */
        const deadline = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
        });
        try {
            await Promise.race([next(), deadline]);
        } finally {
            clearTimeout(timer!);
        }
    };
}

/**
 * Enforces a CORS policy by setting response headers before the chain runs.
 *
 * @param options - CORS configuration.
 * @param options.allowedOrigins - Allowed origin strings or `"*"`.
 * @param options.allowedMethods - HTTP methods to allow.
 * @param options.allowedHeaders - Request headers to allow.
 * @param options.maxAge - Preflight cache duration in seconds.
 * @returns Middleware function.
 * @since 1.6.0
 */
export function cors(options: {
    allowedOrigins?: string[];
    allowedMethods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
} = {}): Middleware {
    /**
 * TODO: describe what this does.
     * @constant origins
     * @type {any}
     */
    const origins  = options.allowedOrigins ?? ["*"];
    /**
 * TODO: describe what this does.
     * @constant methods
     * @type {any}
     */
    const methods  = (options.allowedMethods ?? ["GET", "POST", "PUT", "DELETE", "OPTIONS"]).join(", ");
    /**
 * TODO: describe what this does.
     * @constant headers
     * @type {any}
     */
    const headers  = (options.allowedHeaders ?? ["Content-Type", "Authorization"]).join(", ");
    /**
 * TODO: describe what this does.
     * @constant maxAge
     * @type {any}
     */
    const maxAge   = options.maxAge ?? 86400;
    return async (ctx, next) => {
        ctx.response.headers["Access-Control-Allow-Methods"] = methods;
        ctx.response.headers["Access-Control-Allow-Headers"] = headers;
        ctx.response.headers["Access-Control-Max-Age"] = String(maxAge);
        if (origins.includes("*")) {
            ctx.response.headers["Access-Control-Allow-Origin"] = "*";
        }
        await next();
    };
}

/**
 * Converts AppErrors thrown downstream into structured JSON responses.
 * Must be registered via `pipeline.catch()`.
 *
 * @returns Error middleware function.
 * @since 1.6.0
 */
export function errorToResponse(): ErrorMiddleware {
    return async (err, ctx) => {
        /**
 * TODO: describe what this does.
         * @constant ae
         * @type {any}
         */
        const ae = err as AppError;
        /**
 * TODO: describe what this does.
         * @constant status
         * @type {any}
         */
        const status = typeof ae?.status === "number" ? ae.status : 500;
        ctx.response.status = status;
        ctx.response.body = ae?.toJSON?.() ?? { code: "INTERNAL_ERROR", message: "An unexpected error occurred" };
        ctx.response.headers["Content-Type"] = "application/json";
    };
}

/**
 * Creates a default Context object for a request.
 *
 * @param method - HTTP method.
 * @param path - URL path.
 * @param body - Pre-parsed request body.
 * @param query - Query parameter map.
 * @returns A fresh Context.
 * @since 1.6.0
 */
export function createContext(
    method: string,
    path: string,
    body: unknown = null,
    query: Record<string, string> = {}
): Context {
    return {
        method: method.toUpperCase(),
        path,
        query,
        body,
        response: { status: 200, body: null, headers: {} },
        state: {},
        startedAt: new Date().toISOString(),
    };
}
