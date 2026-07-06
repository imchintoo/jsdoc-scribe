import type { User, Post, UserRole, HttpStatus, Paginated, ID, Nullable } from "./models";

// ─── Request / Response types ─────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @interface
 * @property {T} data
 * @property {HttpStatus} status
 * @property {string} message
 */
export interface ApiResponse<T> {
    data: T;
    status: HttpStatus;
    message: string;
}

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 * @property {string} password
 */
export interface CreateUserRequest {
    name: string;
    email: string;
    role?: UserRole;
    password: string;
}

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 */
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
}

/**
 * TODO: describe what this does.
 * @interface
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 */
export interface CreatePostRequest {
    title: string;
    content: string;
    tags?: string[];
}

/**
 * TODO: describe what this does.
 * @typedef {string} AuthToken
 */
export type AuthToken = string;
/**
 * TODO: describe what this does.
 * @typedef {(req: Request, res: Response, next: () => void) => void} Middleware
 */
export type Middleware = (req: Request, res: Response, next: () => void) => void;

// ─── HTTP client ──────────────────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @class HttpClient
 * @exported
 */
export class HttpClient {
    /**
 * TODO: describe what this does.
     * @member baseUrl
     * @type {string}
     * @private
     */
    private baseUrl: string;
    /**
 * TODO: describe what this does.
     * @member defaultHeaders
     * @type {Record<string, string>}
     * @private
     */
    private defaultHeaders: Record<string, string>;
    /**
 * TODO: describe what this does.
     * @member timeout
     * @type {number}
     * @private
     */
    private timeout: number;

    /**
     * TODO: describe what this does.
     * @param {string} baseUrl - TODO: describe parameter "baseUrl".
     * @param {number} [timeout] - TODO: describe parameter "timeout".
     * @constructor
     */
    constructor(baseUrl: string, timeout = 10_000) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.defaultHeaders = { "Content-Type": "application/json" };
        this.timeout = timeout;
    }

    /**
     * TODO: describe what this does.
     * @param {AuthToken} token - TODO: describe parameter "token".
     * @method setAuthToken
     * @public
     */
    setAuthToken(token: AuthToken): void {
        this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    /**
     * TODO: describe what this does.
     * @method clearAuthToken
     * @public
     */
    clearAuthToken(): void {
        delete this.defaultHeaders["Authorization"];
    }

    /**
 * TODO: describe what this does.
     * @getter isAuthenticated
     * @public
     * @returns {boolean}
     */
    get isAuthenticated(): boolean {
        return "Authorization" in this.defaultHeaders;
    }

    /**
     * TODO: describe what this does.
     * @param {string} method - TODO: describe parameter "method".
     * @param {string} path - TODO: describe parameter "path".
     * @param {unknown} [body] - TODO: describe parameter "body".
     * @returns {Promise<T>} TODO: describe the return value.
     * @method request
     * @private
     * @async
     */
    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        /**
 * TODO: describe what this does.
         * @constant controller
         * @type {AbortController}
         */
        const controller = new AbortController();
        /**
 * TODO: describe what this does.
         * @constant timer
         * @type {any}
         */
        const timer = setTimeout(() => controller.abort(), this.timeout);
        try {
            /**
 * TODO: describe what this does.
             * @constant res
             * @type {any}
             */
            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: this.defaultHeaders,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.json();
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * TODO: describe what this does.
     * @param {string} path - TODO: describe parameter "path".
     * @returns {Promise<T>} TODO: describe the return value.
     * @method get
     * @public
     * @async
     */
    async get<T>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }

    /**
     * TODO: describe what this does.
     * @param {string} path - TODO: describe parameter "path".
     * @param {unknown} body - TODO: describe parameter "body".
     * @returns {Promise<T>} TODO: describe the return value.
     * @method post
     * @public
     * @async
     */
    async post<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>("POST", path, body);
    }

    /**
     * TODO: describe what this does.
     * @param {string} path - TODO: describe parameter "path".
     * @param {unknown} body - TODO: describe parameter "body".
     * @returns {Promise<T>} TODO: describe the return value.
     * @method put
     * @public
     * @async
     */
    async put<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>("PUT", path, body);
    }

    /**
     * TODO: describe what this does.
     * @param {string} path - TODO: describe parameter "path".
     * @returns {Promise<T>} TODO: describe the return value.
     * @method delete
     * @public
     * @async
     */
    async delete<T>(path: string): Promise<T> {
        return this.request<T>("DELETE", path);
    }
}

// ─── User API ─────────────────────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @class UserApi
 * @exported
 */
export class UserApi {
    /**
     * TODO: describe what this does.
     * @param {HttpClient} client - TODO: describe parameter "client".
     * @constructor
     */
    constructor(private readonly client: HttpClient) {}

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {Promise<ApiResponse<User>>} TODO: describe the return value.
     * @method getUser
     * @public
     * @async
     */
    async getUser(id: ID): Promise<ApiResponse<User>> {
        return this.client.get(`/users/${id}`);
    }

    /**
     * TODO: describe what this does.
     * @param {number} [page] - TODO: describe parameter "page".
     * @param {number} [pageSize] - TODO: describe parameter "pageSize".
     * @returns {Promise<ApiResponse<Paginated<User>>>} TODO: describe the return value.
     * @method listUsers
     * @public
     * @async
     */
    async listUsers(page = 1, pageSize = 20): Promise<ApiResponse<Paginated<User>>> {
        return this.client.get(`/users?page=${page}&pageSize=${pageSize}`);
    }

    /**
     * TODO: describe what this does.
     * @param {CreateUserRequest} req - TODO: describe parameter "req".
     * @returns {Promise<ApiResponse<User>>} TODO: describe the return value.
     * @method createUser
     * @public
     * @async
     */
    async createUser(req: CreateUserRequest): Promise<ApiResponse<User>> {
        return this.client.post("/users", req);
    }

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @param {UpdateUserRequest} req - TODO: describe parameter "req".
     * @returns {Promise<ApiResponse<User>>} TODO: describe the return value.
     * @method updateUser
     * @public
     * @async
     */
    async updateUser(id: ID, req: UpdateUserRequest): Promise<ApiResponse<User>> {
        return this.client.put(`/users/${id}`, req);
    }

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {Promise<ApiResponse<null>>} TODO: describe the return value.
     * @method deleteUser
     * @public
     * @async
     */
    async deleteUser(id: ID): Promise<ApiResponse<null>> {
        return this.client.delete(`/users/${id}`);
    }
}

// ─── Post API ─────────────────────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @class PostApi
 * @exported
 */
export class PostApi {
    /**
     * TODO: describe what this does.
     * @param {HttpClient} client - TODO: describe parameter "client".
     * @constructor
     */
    constructor(private readonly client: HttpClient) {}

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {Promise<ApiResponse<Post>>} TODO: describe the return value.
     * @method getPost
     * @public
     * @async
     */
    async getPost(id: ID): Promise<ApiResponse<Post>> {
        return this.client.get(`/posts/${id}`);
    }

    /**
     * TODO: describe what this does.
     * @param {ID} [authorId] - TODO: describe parameter "authorId".
     * @param {number} [page] - TODO: describe parameter "page".
     * @returns {Promise<ApiResponse<Paginated<Post>>>} TODO: describe the return value.
     * @method listPosts
     * @public
     * @async
     */
    async listPosts(authorId?: ID, page = 1): Promise<ApiResponse<Paginated<Post>>> {
        /**
 * TODO: describe what this does.
         * @constant q
         * @type {any}
         */
        const q = authorId ? `?authorId=${authorId}&page=${page}` : `?page=${page}`;
        return this.client.get(`/posts${q}`);
    }

    /**
     * TODO: describe what this does.
     * @param {ID} authorId - TODO: describe parameter "authorId".
     * @param {CreatePostRequest} req - TODO: describe parameter "req".
     * @returns {Promise<ApiResponse<Post>>} TODO: describe the return value.
     * @method createPost
     * @public
     * @async
     */
    async createPost(authorId: ID, req: CreatePostRequest): Promise<ApiResponse<Post>> {
        return this.client.post(`/users/${authorId}/posts`, req);
    }

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {Promise<ApiResponse<Post>>} TODO: describe the return value.
     * @method publishPost
     * @public
     * @async
     */
    async publishPost(id: ID): Promise<ApiResponse<Post>> {
        return this.client.put(`/posts/${id}/publish`, {});
    }

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {Promise<ApiResponse<null>>} TODO: describe the return value.
     * @method deletePost
     * @public
     * @async
     */
    async deletePost(id: ID): Promise<ApiResponse<null>> {
        return this.client.delete(`/posts/${id}`);
    }
}

// ─── Auth service ─────────────────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @class AuthService
 * @exported
 */
export class AuthService {
    /**
 * TODO: describe what this does.
     * @member client
     * @type {HttpClient}
     * @private
     */
    private client: HttpClient;
    /**
 * TODO: describe what this does.
     * @member currentToken
     * @type {Nullable<AuthToken>}
     * @private
     */
    private currentToken: Nullable<AuthToken> = null;

    /**
     * TODO: describe what this does.
     * @param {HttpClient} client - TODO: describe parameter "client".
     * @constructor
     */
    constructor(client: HttpClient) {
        this.client = client;
    }

    /**
     * TODO: describe what this does.
     * @param {string} email - TODO: describe parameter "email".
     * @param {string} password - TODO: describe parameter "password".
     * @returns {Promise<AuthToken>} TODO: describe the return value.
     * @method login
     * @public
     * @async
     */
    async login(email: string, password: string): Promise<AuthToken> {
        /**
 * TODO: describe what this does.
         * @constant res
         * @type {any}
         */
        const res = await this.client.post<{ token: AuthToken }>("/auth/login", { email, password });
        this.currentToken = res.token;
        this.client.setAuthToken(res.token);
        return res.token;
    }

    /**
     * TODO: describe what this does.
     * @returns {Promise<void>} TODO: describe the return value.
     * @method logout
     * @public
     * @async
     */
    async logout(): Promise<void> {
        await this.client.post("/auth/logout", {});
        this.currentToken = null;
        this.client.clearAuthToken();
    }

    /**
     * TODO: describe what this does.
     * @returns {Promise<AuthToken>} TODO: describe the return value.
     * @method refreshToken
     * @public
     * @async
     */
    async refreshToken(): Promise<AuthToken> {
        /**
 * TODO: describe what this does.
         * @constant res
         * @type {any}
         */
        const res = await this.client.post<{ token: AuthToken }>("/auth/refresh", {});
        this.currentToken = res.token;
        this.client.setAuthToken(res.token);
        return res.token;
    }

    /**
 * TODO: describe what this does.
     * @getter isLoggedIn
     * @public
     * @returns {boolean}
     */
    get isLoggedIn(): boolean {
        return this.currentToken !== null;
    }
}

// ─── Stand-alone helpers ──────────────────────────────────────────────────────

/**
 * TODO: describe what this does.
 * @param {Record<string, string | number | boolean | undefined>} params - TODO: describe parameter "params".
 * @returns {string} TODO: describe the return value.
 * @function buildQueryString
 * @exported
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    return Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
}

/**
 * TODO: describe what this does.
 * @param {() => Promise<T>} fn - TODO: describe parameter "fn".
 * @param {number} [maxAttempts] - TODO: describe parameter "maxAttempts".
 * @returns {Promise<T>} TODO: describe the return value.
 * @function withRetry
 * @exported
 * @async
 */
export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    /**
 * TODO: describe what this does.
     * @variable lastError
     * @type {Error | undefined}
     */
    let lastError: Error | undefined;
    for (let i = 0; i < maxAttempts; i++) {
        try { return await fn(); } catch (e) { lastError = e as Error; }
    }
    throw lastError;
}

/**
 * TODO: describe what this does.
 * @param {string} baseUrl - TODO: describe parameter "baseUrl".
 * @param {AuthToken} [token] - TODO: describe parameter "token".
 * @returns {any} TODO: describe the return value.
 * @function createApiFactory
 */
export const createApiFactory = (baseUrl: string, token?: AuthToken) => {
    /**
 * TODO: describe what this does.
     * @constant client
     * @type {HttpClient}
     */
    const client = new HttpClient(baseUrl);
    if (token) client.setAuthToken(token);
    return {
        users: new UserApi(client),
        posts: new PostApi(client),
        auth: new AuthService(client),
    };
};
