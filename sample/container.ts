/**
 * @module container
 * @description Lightweight dependency injection container with service lifetime management.
 * Supports singleton, transient, and scoped lifetimes. Services are registered by token
 * (a string or Symbol) and resolved lazily on first access.
 * @since 1.6.0
 */

import type { EventBus } from "./events";
import type { AppError } from "./errors";

// ─── Tokens & lifetimes ───────────────────────────────────────────────────────

/**
 * A service token — any value that can be used as a Map key.
 * Using `Symbol("TokenName")` is recommended to guarantee uniqueness.
 */
export type Token<T = unknown> = string | symbol;

/**
 * Service lifetime values.
 * - `singleton`: one instance shared across the entire container lifetime.
 * - `transient`: a new instance on every `resolve()` call.
 * - `scoped`:    one instance per container scope (child container).
 */
export type Lifetime = "singleton" | "transient" | "scoped";

/** Factory function that receives the container and returns a service instance. */
export type Factory<T> = (container: Container) => T;

/** Registration record stored in the container registry. */
interface Registration<T> {
    factory: Factory<T>;
    lifetime: Lifetime;
    instance?: T;
}

// ─── Container ────────────────────────────────────────────────────────────────

/**
 * Dependency injection container.
 *
 * Register services with `register()`, then resolve them with `resolve()`.
 * Child containers (scopes) inherit all parent registrations but maintain
 * their own scoped instances. Use {@link ConsoleLogger} as a default logger
 * and {@link MemoryCache} for in-process caching.
 *
 * @example
 * const container = new Container();
 *
 * container.register("logger", () => new ConsoleLogger(), "singleton");
 * container.register("userService", (c) => new UserService(c.resolve("logger")), "singleton");
 *
 * const userService = container.resolve<UserService>("userService");
 * @since 1.6.0
 */
export class Container {
    /**
 * TODO: describe what this does.
     * @member registry
     * @type {Map}
     * @private
     */
    private registry = new Map<Token, Registration<unknown>>();
    /**
 * TODO: describe what this does.
     * @member parent
     * @type {Container}
     * @private
     * @readonly
     */
    private readonly parent?: Container;

    /**
     * @param parent - Optional parent container. Resolutions fall through to parent when
     *   the token is not registered locally.
     */
    constructor(parent?: Container) {
        this.parent = parent;
    }

    /**
     * Register a service factory with a given lifetime.
     *
     * @param token - Unique identifier for this service.
     * @param factory - Function that creates the service, receiving this container.
     * @param lifetime - Service lifetime (default: "singleton").
     * @returns `this` for chaining.
     * @throws {Error} If the token is already registered and `overwrite` is false.
     * @since 1.6.0
     */
    register<T>(token: Token<T>, factory: Factory<T>, lifetime: Lifetime = "singleton"): this {
        this.registry.set(token, { factory: factory as Factory<unknown>, lifetime });
        return this;
    }

    /**
     * Register a pre-constructed value as a singleton.
     * Equivalent to `register(token, () => value, "singleton")`.
     *
     * @param token - Unique identifier.
     * @param value - The pre-built instance to register.
     * @returns `this` for chaining.
     * @since 1.6.0
     */
    registerValue<T>(token: Token<T>, value: T): this {
        this.registry.set(token, { /**
  * Factory.
  * @returns {any}
  */
 factory: () => value as unknown, lifetime: "singleton", instance: value as unknown });
        return this;
    }

    /**
     * Resolve (create or retrieve) a registered service.
     *
     * @param token - The service token to resolve.
     * @returns The resolved service instance.
     * @throws {Error} If the token is not registered in this container or any ancestor.
     * @since 1.6.0
     */
    resolve<T>(token: Token<T>): T {
        /**
 * TODO: describe what this does.
         * @constant reg
         * @type {any}
         */
        const reg = this.registry.get(token) as Registration<T> | undefined;
        if (!reg) {
            if (this.parent) return this.parent.resolve(token);
            throw new Error(`Service not registered: ${String(token)}`);
        }
        if (reg.lifetime === "singleton" || reg.lifetime === "scoped") {
            if (reg.instance === undefined) reg.instance = reg.factory(this);
            return reg.instance as T;
        }
        // transient — new instance every time
        return reg.factory(this);
    }

    /**
     * Returns true if a service is registered under the given token
     * (in this container or any ancestor).
     *
     * @param token - Token to check.
     * @returns Whether the token resolves.
     * @since 1.6.0
     */
    has(token: Token): boolean {
        return this.registry.has(token) || (this.parent?.has(token) ?? false);
    }

    /**
     * Creates a child container (scope) that inherits all parent registrations.
     * Scoped services get their own instances within this child.
     *
     * @returns A new child Container.
     * @since 1.6.0
     */
    createScope(): Container {
        return new Container(this);
    }

    /**
     * Disposes all singleton/scoped instances by calling `dispose()` if they implement it.
     * Does not affect transient instances (callers are responsible for those).
     *
     * @returns Promise that resolves once all disposables are cleaned up.
     * @since 1.6.0
     */
    async dispose(): Promise<void> {
        for (const reg of this.registry.values()) {
            /**
 * TODO: describe what this does.
             * @constant inst
             * @type {any}
             */
            const inst = reg.instance as { dispose?: () => unknown } | undefined;
            if (inst && typeof inst.dispose === "function") {
                await inst.dispose();
            }
        }
        this.registry.clear();
    }

    /** Number of services registered directly in this container (not counting parent). */
    get size(): number { return this.registry.size; }
}

// ─── Built-in services ────────────────────────────────────────────────────────

/** Log severity levels. */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured logger interface consumed by services throughout the container.
 * @since 1.6.0
 */
export interface ILogger {
    /** Log a debug-level message. @param msg - Message. @param meta - Optional context. */
    debug(msg: string, meta?: Record<string, unknown>): void;
    /** Log an info-level message. @param msg - Message. @param meta - Optional context. */
    info(msg: string, meta?: Record<string, unknown>): void;
    /** Log a warning. @param msg - Message. @param meta - Optional context. */
    warn(msg: string, meta?: Record<string, unknown>): void;
    /** Log an error. @param msg - Message. @param err - Optional error instance. */
    error(msg: string, err?: Error): void;
}

/**
 * Console-backed logger that prefixes each line with a timestamp and severity.
 * @since 1.6.0
 */
export class ConsoleLogger implements ILogger {
    /**
     * TODO: describe what this does.
     * @param {any} [minLevel] - - Minimum level to output (default: "debug").
     * @param {any} [prefix] - - Optional string prepended to every log line.
     */
    constructor(
        private readonly minLevel: LogLevel = "debug",
        private readonly prefix = ""
    ) {}

    /**
 * TODO: describe what this does.
     * @member _levels
     * @type {Record<LogLevel, number>}
     * @private
     */
    private _levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

    /**
     * TODO: describe what this does.
     * @param {LogLevel} level - TODO: describe parameter "level".
     * @returns {boolean} TODO: describe the return value.
     * @method _should
     * @private
     */
    private _should(level: LogLevel): boolean {
        return this._levels[level] >= this._levels[this.minLevel];
    }

    /**
     * TODO: describe what this does.
     * @param {LogLevel} level - TODO: describe parameter "level".
     * @param {string} msg - TODO: describe parameter "msg".
     * @returns {string} TODO: describe the return value.
     * @method _fmt
     * @private
     */
    private _fmt(level: LogLevel, msg: string): string {
        /**
 * TODO: describe what this does.
         * @constant ts
         * @type {any}
         */
        const ts = new Date().toISOString();
        return `${ts} [${level.toUpperCase()}]${this.prefix ? " " + this.prefix : ""} ${msg}`;
    }

    /**
     * TODO: describe what this does.
     * @param {string} msg - - TODO: describe parameter "msg".
     * @param {Record<string, unknown>} [meta] - - TODO: describe parameter "meta".
     * @inheritdoc
     */
    debug(msg: string, meta?: Record<string, unknown>): void {
        if (this._should("debug")) console.debug(this._fmt("debug", msg), meta ?? "");
    }
    /**
     * TODO: describe what this does.
     * @param {string} msg - - TODO: describe parameter "msg".
     * @param {Record<string, unknown>} [meta] - - TODO: describe parameter "meta".
     * @inheritdoc
     */
    info(msg: string, meta?: Record<string, unknown>): void {
        if (this._should("info")) console.info(this._fmt("info", msg), meta ?? "");
    }
    /**
     * TODO: describe what this does.
     * @param {string} msg - - TODO: describe parameter "msg".
     * @param {Record<string, unknown>} [meta] - - TODO: describe parameter "meta".
     * @inheritdoc
     */
    warn(msg: string, meta?: Record<string, unknown>): void {
        if (this._should("warn")) console.warn(this._fmt("warn", msg), meta ?? "");
    }
    /**
     * TODO: describe what this does.
     * @param {string} msg - - TODO: describe parameter "msg".
     * @param {Error} [err] - - TODO: describe parameter "err".
     * @inheritdoc
     */
    error(msg: string, err?: Error): void {
        if (this._should("error")) console.error(this._fmt("error", msg), err ?? "");
    }
}

/**
 * Generic in-memory cache with TTL-based expiration.
 * @since 1.6.0
 */
export class MemoryCache<V = unknown> {
    /**
 * TODO: describe what this does.
     * @member store
     * @type {Map}
     * @private
     */
    private store = new Map<string, { value: V; expiresAt: number }>();

    /**
     * TODO: describe what this does.
     * @param {any} [defaultTtlMs] - - Default TTL in milliseconds (default: 60 000).
     */
    constructor(private readonly defaultTtlMs = 60_000) {}

    /**
     * Store a value. Overwrites any existing entry for the same key.
     * @param key - Cache key.
     * @param value - Value to store.
     * @param ttlMs - TTL in ms (overrides default).
     * @since 1.6.0
     */
    set(key: string, value: V, ttlMs = this.defaultTtlMs): void {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    /**
     * Retrieve a cached value, or undefined if missing/expired.
     * @param key - Cache key.
     * @returns The cached value, or undefined.
     * @since 1.6.0
     */
    get(key: string): V | undefined {
        /**
 * TODO: describe what this does.
         * @constant entry
         * @type {any}
         */
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
        return entry.value;
    }

    /**
     * Returns true if a non-expired entry exists for `key`.
     * @param key - Cache key.
     * @returns Whether the key is cached.
     */
    has(key: string): boolean { return this.get(key) !== undefined; }

    /**
     * Deletes a cache entry.
     * @param key - Cache key.
     * @returns True if the key existed.
     */
    delete(key: string): boolean { return this.store.delete(key); }

    /**
     * Removes all expired entries from the store. Returns the count of removed entries.
     * @returns {number} TODO: describe the return value.
     */
    evictExpired(): number {
        /**
 * TODO: describe what this does.
         * @constant now
         * @type {any}
         */
        const now = Date.now();
        /**
 * TODO: describe what this does.
         * @variable count
         * @type {number}
         */
        let count = 0;
        for (const [k, v] of this.store) {
            if (now > v.expiresAt) { this.store.delete(k); count++; }
        }
        return count;
    }

    /** Total number of entries (including expired, until evicted). */
    get totalSize(): number {
        return this.store.size;
    }

    /** Removes every entry from the cache, regardless of expiration. */
    clear(): void {
        this.store.clear();
    }
}

// ─── Convenience factory ─────────────────────────────────────────────────────

/**
 * Builds a root {@link Container} pre-wired with a {@link ConsoleLogger} and
 * a {@link MemoryCache}, plus an {@link EventBus} instance forwarded from the
 * events module. Intended as the composition root for the sample app.
 *
 * @param eventBus - Shared event bus instance to register into the container.
 * @param logLevel - Minimum log level for the default logger (default: "info").
 * @returns A configured root Container.
 * @since 1.6.0
 */
export function createRootContainer(eventBus: EventBus<Record<string, unknown>>, logLevel: LogLevel = "info"): Container {
    /**
 * TODO: describe what this does.
     * @constant container
     * @type {Container}
     */
    const container = new Container();
    container.register<ILogger>("logger", () => new ConsoleLogger(logLevel), "singleton");
    container.register<MemoryCache<unknown>>("cache", () => new MemoryCache(), "singleton");
    container.registerValue<EventBus<Record<string, unknown>>>("eventBus", eventBus);
    return container;
}
