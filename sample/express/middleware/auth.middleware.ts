import type { Request, Response, NextFunction } from "express";

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} userId
 */
export interface AuthenticatedRequest extends Request {
    userId?: string;
}

/**
 * Error thrown when unauthorized related issues occur.
 * @extends Error
 */
export class UnauthorizedError extends Error {
    /**
 * TODO: describe what this does.
     * @member status
     * @type {number}
     * @public
     * @readonly
     */
    readonly status = 401;

    /**
     * TODO: describe what this does.
     * @param {string} [message] - - descriptive message.
     * @constructor
     */
    constructor(message = "Missing or invalid authorization token") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

/**
 * Extracts the bearer token.
 * @param {string | undefined} header - - header.
 * @returns {string | null} TODO: describe the return value.
 */
function extractBearerToken(header: string | undefined): string | null {
    if (!header) return null;
    /**
 * TODO: describe what this does.
     * @constant [scheme, token]
     * @type {any}
     */
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    return token;
}

/**
 * Decodes the user id from token.
 * @param {string} token - - authentication token.
 * @returns {string} TODO: describe the return value.
 */
function decodeUserIdFromToken(token: string): string {
    // Sample-only "decoding" — a real implementation would verify a JWT signature.
    /**
 * TODO: describe what this does.
     * @constant [userId]
     * @type {any}
     */
    const [userId] = Buffer.from(token, "base64").toString("utf8").split(":");
    return userId;
}

/**
 * Require auth.
 * @param {AuthenticatedRequest} req - - HTTP request object.
 * @param {Response} _res - - res.
 * @param {NextFunction} next - - next middleware function.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    /**
 * TODO: describe what this does.
     * @constant token
     * @type {any}
     */
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        next(new UnauthorizedError());
        return;
    }
    try {
        req.userId = decodeUserIdFromToken(token);
        next();
    } catch {
        next(new UnauthorizedError("Could not decode authorization token"));
    }
}

/**
 * Require role.
 * @param {string[]} allowedRoles - - allowed roles.
 * @returns {any} TODO: describe the return value.
 */
export function requireRole(allowedRoles: string[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        /**
 * TODO: describe what this does.
         * @constant role
         * @type {any}
         */
        const role = req.headers["x-user-role"];
        if (typeof role !== "string" || !allowedRoles.includes(role)) {
            next(new UnauthorizedError(`Requires one of: ${allowedRoles.join(", ")}`));
            return;
        }
        next();
    };
}
