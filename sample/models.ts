// ─── Enums ────────────────────────────────────────────────────────────────────

/** Roles available to a user within the system. */
export enum UserRole {
    Admin = "admin",
    Editor = "editor",
    Viewer = "viewer",
}

/** Standard HTTP status codes used throughout the API. */
export enum HttpStatus {
    Ok = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    ServerError = 500,
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** Marks an entity with creation and update timestamps. */
export interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

/** Wraps a paginated list result with metadata. */
export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
}

/** Generic CRUD repository contract for a domain entity. */
export interface Repository<T, ID> {
    findById(id: ID): Promise<T | null>;
    findAll(filter?: Partial<T>): Promise<T[]>;
    save(entity: T): Promise<T>;
    delete(id: ID): Promise<void>;
}

// ─── Type aliases ─────────────────────────────────────────────────────────────

/** Flexible identifier — either a string UUID or a numeric PK. */
export type ID = string | number;

/** A value that may be null. */
export type Nullable<T> = T | null;

/** A value that may be null or undefined. */
export type Maybe<T> = T | null | undefined;

/** Async-capable event handler function. */
export type Handler<T> = (event: T) => void | Promise<void>;

/** Zero-argument async factory / thunk. */
export type Resolver<T> = () => Promise<T>;

// ─── Base / abstract classes ──────────────────────────────────────────────────

/**
 * Abstract base for all domain entities.
 * Provides id, timestamps, and a touch() helper.
 *
 * @example
 * class Product extends BaseEntity {
 *   validate() { return this.name.length > 0; }
 * }
 */
export abstract class BaseEntity implements Timestamped {
    /** Immutable entity identifier assigned at construction. */
    readonly id: ID;
    /**
 * TODO: describe what this does.
     * @member createdAt
     * @type {Date}
     * @public
     */
    createdAt: Date;
    /**
 * TODO: describe what this does.
     * @member updatedAt
     * @type {Date}
     * @public
     */
    updatedAt: Date;

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @constructor
     */
    constructor(id: ID) {
        this.id = id;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Subclasses must implement domain-specific validation logic.
     * @returns {boolean} TODO: describe the return value.
     */
    abstract validate(): boolean;

    /** Updates the updatedAt timestamp to the current time. */
    touch(): void {
        this.updatedAt = new Date();
    }

    /**
     * Returns a plain JSON-safe representation of the entity.
     * @returns {object} TODO: describe the return value.
     */
    toJSON(): object {
        return { id: this.id, createdAt: this.createdAt, updatedAt: this.updatedAt };
    }
}

// ─── Concrete models ──────────────────────────────────────────────────────────

/**
 * Represents a registered user in the system.
 * Stores credentials, role, and login tracking.
 */
export class User extends BaseEntity {
    /**
 * TODO: describe what this does.
     * @member name
     * @type {string}
     * @public
     */
    name: string;
    /**
 * TODO: describe what this does.
     * @member email
     * @type {string}
     * @public
     */
    email: string;
    /**
 * TODO: describe what this does.
     * @member role
     * @type {UserRole}
     * @public
     */
    role: UserRole;
    /**
 * TODO: describe what this does.
     * @member passwordHash
     * @type {string}
     * @private
     */
    private passwordHash: string;
    /**
 * TODO: describe what this does.
     * @member loginCount
     * @type {number}
     * @protected
     */
    protected loginCount: number = 0;

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @param {string} name - TODO: describe parameter "name".
     * @param {string} email - TODO: describe parameter "email".
     * @param {UserRole} [role] - TODO: describe parameter "role".
     * @constructor
     */
    constructor(id: ID, name: string, email: string, role: UserRole = UserRole.Viewer) {
        super(id);
        this.name = name;
        this.email = email;
        this.role = role;
        this.passwordHash = "";
    }

    /**
     * TODO: describe what this does.
     * @returns {boolean} TODO: describe the return value.
     * @method validate
     * @public
     */
    validate(): boolean {
        return this.name.length > 0 && this.email.includes("@");
    }

    /** Formatted display string combining name and role. */
    get displayName(): string {
        return `${this.name} (${this.role})`;
    }

    /** Hashes and stores a new password (min 8 characters). */
    set password(raw: string) {
        if (raw.length < 8) throw new Error("Password too short");
        this.passwordHash = Buffer.from(raw).toString("base64");
    }

    /**
     * Returns true if the user holds the Admin role.
     * @returns {boolean} TODO: describe the return value.
     */
    isAdmin(): boolean {
        return this.role === UserRole.Admin;
    }

    /** Increments the login counter and updates the timestamp. */
    recordLogin(): void {
        this.loginCount += 1;
        this.touch();
    }
}

/**
 * A blog post authored by a User.
 * Supports tags, excerpt generation, and a publish workflow.
 */
export class Post extends BaseEntity {
    /**
 * TODO: describe what this does.
     * @member title
     * @type {string}
     * @public
     */
    title: string;
    /**
 * TODO: describe what this does.
     * @member content
     * @type {string}
     * @public
     */
    content: string;
    /**
 * TODO: describe what this does.
     * @member authorId
     * @type {ID}
     * @public
     */
    authorId: ID;
    /**
 * TODO: describe what this does.
     * @member published
     * @type {boolean}
     * @public
     */
    published: boolean;
    /**
 * TODO: describe what this does.
     * @member tags
     * @type {string[]}
     * @public
     */
    tags: string[];

    /**
     * TODO: describe what this does.
     * @param {ID} id - TODO: describe parameter "id".
     * @param {string} title - TODO: describe parameter "title".
     * @param {string} content - TODO: describe parameter "content".
     * @param {ID} authorId - TODO: describe parameter "authorId".
     * @constructor
     */
    constructor(id: ID, title: string, content: string, authorId: ID) {
        super(id);
        this.title = title;
        this.content = content;
        this.authorId = authorId;
        this.published = false;
        this.tags = [];
    }

    /**
     * TODO: describe what this does.
     * @returns {boolean} TODO: describe the return value.
     * @method validate
     * @public
     */
    validate(): boolean {
        return this.title.length > 0 && this.content.length > 0;
    }

    /** Returns the first 160 characters of content as a preview. */
    get excerpt(): string {
        return this.content.slice(0, 160) + (this.content.length > 160 ? "..." : "");
    }

    /** Marks the post as published; throws if validation fails. */
    publish(): void {
        if (!this.validate()) throw new Error("Post is invalid");
        this.published = true;
        this.touch();
    }

    /**
     * Appends a tag if it is not already present.
     * @param {string} tag - TODO: describe parameter "tag".
     */
    addTag(tag: string): void {
        if (!this.tags.includes(tag)) this.tags.push(tag);
    }
}

/**
 * An in-memory keyed collection of domain entities.
 * Useful for lightweight caching and testing without a database.
 *
 * @example
 * const users = new Collection<User>();
 * users.add(new User("1", "Alice", "alice@example.com", UserRole.Admin));
 * console.log(users.size); // 1
 */
export class Collection<T extends BaseEntity> {
    /**
 * TODO: describe what this does.
     * @member items
     * @type {Map<ID, T>}
     * @private
     */
    private items: Map<ID, T> = new Map();

    /**
     * Adds or replaces the entity at its id key.
     * @param {T} item - TODO: describe parameter "item".
     */
    add(item: T): void {
        this.items.set(item.id, item);
    }

    /**
     * Returns the entity for the given id, or undefined.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {T | undefined} TODO: describe the return value.
     */
    get(id: ID): T | undefined {
        return this.items.get(id);
    }

    /**
     * Removes the entity by id. Returns true if it existed.
     * @param {ID} id - TODO: describe parameter "id".
     * @returns {boolean} TODO: describe the return value.
     */
    remove(id: ID): boolean {
        return this.items.delete(id);
    }

    /** Number of entities currently in the collection. */
    get size(): number {
        return this.items.size;
    }

    /**
     * Returns all entities matching the predicate.
     * @param {(item: T) => boolean} predicate - TODO: describe parameter "predicate".
     * @returns {T[]} TODO: describe the return value.
     */
    filter(predicate: (item: T) => boolean): T[] {
        return [...this.items.values()].filter(predicate);
    }

    /**
     * Returns all entities as a plain array.
     * @returns {T[]} TODO: describe the return value.
     */
    toArray(): T[] {
        return [...this.items.values()];
    }
}
