/**
 * @module events
 * @description Typed, async-capable event bus with wildcard support and priority ordering.
 * Handlers can be synchronous or return a Promise. The bus awaits all handlers in order.
 * @since 1.6.0
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A synchronous or asynchronous event handler function. */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/** Options passed when subscribing a handler. */
export interface SubscribeOptions {
    /** If true the handler fires at most once then auto-unsubscribes. */
    once?: boolean;
    /**
     * Execution priority — higher numbers run first.
     * Default is 0.
     */
    priority?: number;
}

/** Internal subscription record stored per event name. */
interface Subscription<T> {
    handler: EventHandler<T>;
    once: boolean;
    priority: number;
    id: number;
}

/** Snapshot of EventBus internal state, useful for diagnostics. */
export interface BusStats {
    /** Total number of active subscriptions across all events. */
    totalSubscriptions: number;
    /** Number of distinct event names with at least one subscriber. */
    distinctEvents: number;
    /** Map of event name → active subscription count. */
    perEvent: Record<string, number>;
}

// ─── EventBus ─────────────────────────────────────────────────────────────────

/**
 * Strongly-typed async event bus.
 *
 * `TEvents` is a map of event name → payload type.
 * Subscribe with `on()`, publish with `emit()`, and clean up with `off()` or the
 * unsubscribe function returned by `on()`.
 *
 * @example
 * interface AppEvents {
 *   "user:created": { userId: string; email: string };
 *   "user:deleted": { userId: string };
 * }
 *
 * const bus = new EventBus<AppEvents>();
 * const unsub = bus.on("user:created", async ({ userId }) => {
 *   await sendWelcomeEmail(userId);
 * });
 * await bus.emit("user:created", { userId: "1", email: "alice@example.com" });
 * unsub(); // remove handler
 * @since 1.6.0
 */
export class EventBus<TEvents extends Record<string, unknown>> {
    /**
 * TODO: describe what this does.
     * @member subs
     * @type {Map}
     * @private
     */
    private subs = new Map<keyof TEvents, Subscription<unknown>[]>();
    /**
 * TODO: describe what this does.
     * @member idCounter
     * @type {number}
     * @private
     */
    private idCounter = 0;
    /**
 * TODO: describe what this does.
     * @member _emitCount
     * @type {number}
     * @private
     */
    private _emitCount = 0;

    /**
     * Subscribe a handler to an event.
     *
     * @param event - Event name to listen on.
     * @param handler - Callback invoked with the event payload.
     * @param options - Subscription options (once, priority).
     * @returns An unsubscribe function — call it to remove this handler.
     * @since 1.6.0
     */
    on<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>,
        options: SubscribeOptions = {}
    ): () => void {
        /**
 * TODO: describe what this does.
         * @constant id
         * @type {any}
         */
        const id = ++this.idCounter;
        /**
 * TODO: describe what this does.
         * @constant sub
         * @type {Subscription<unknown>}
         */
        const sub: Subscription<unknown> = {
            handler: handler as EventHandler<unknown>,
            once: options.once ?? false,
            priority: options.priority ?? 0,
            id,
        };
        /**
 * TODO: describe what this does.
         * @constant list
         * @type {any}
         */
        const list = this.subs.get(event) ?? [];
        list.push(sub);
        list.sort((a, b) => b.priority - a.priority);
        this.subs.set(event, list);
        return () => this._removeById(event, id);
    }

    /**
     * Subscribe a handler that fires exactly once then removes itself.
     *
     * @param event - Event name to listen on.
     * @param handler - Callback to invoke.
     * @param options - Additional options (priority only — `once` is always true).
     * @returns An unsubscribe function.
     * @since 1.6.0
     */
    once<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>,
        options: Omit<SubscribeOptions, "once"> = {}
    ): () => void {
        return this.on(event, handler, { ...options, once: true });
    }

    /**
     * Remove a specific handler from an event.
     *
     * @param event - Event name.
     * @param handler - The exact handler reference to remove.
     * @returns True if the handler was found and removed.
     * @since 1.6.0
     */
    off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): boolean {
        /**
 * TODO: describe what this does.
         * @constant list
         * @type {any}
         */
        const list = this.subs.get(event);
        if (!list) return false;
        /**
 * TODO: describe what this does.
         * @constant idx
         * @type {any}
         */
        const idx = list.findIndex(s => s.handler === handler);
        if (idx === -1) return false;
        list.splice(idx, 1);
        return true;
    }

    /**
     * Emit an event, calling all matching handlers in priority order (awaiting each).
     *
     * @param event - Event name to emit.
     * @param payload - Data passed to every handler.
     * @returns A promise that resolves when all handlers have completed.
     * @throws {Error} Re-throws if any synchronous handler throws; async errors are not caught.
     * @since 1.6.0
     */
    async emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): Promise<void> {
        this._emitCount++;
        /**
 * TODO: describe what this does.
         * @constant list
         * @type {Array}
         */
        const list = [...(this.subs.get(event) ?? [])];
        /**
 * TODO: describe what this does.
         * @constant toRemove
         * @type {number[]}
         */
        const toRemove: number[] = [];
        for (const sub of list) {
            await sub.handler(payload);
            if (sub.once) toRemove.push(sub.id);
        }
        toRemove.forEach(id => this._removeById(event, id));
    }

    /**
     * Emit an event synchronously without awaiting async handlers.
     * Use when you know all handlers are synchronous and you cannot use await.
     *
     * @param event - Event name to emit.
     * @param payload - Data passed to every handler.
     * @deprecated Prefer `emit()` to ensure async handlers complete.
     * @since 1.6.0
     */
    emitSync<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
        this._emitCount++;
        /**
 * TODO: describe what this does.
         * @constant list
         * @type {Array}
         */
        const list = [...(this.subs.get(event) ?? [])];
        /**
 * TODO: describe what this does.
         * @constant toRemove
         * @type {number[]}
         */
        const toRemove: number[] = [];
        for (const sub of list) {
            sub.handler(payload);
            if (sub.once) toRemove.push(sub.id);
        }
        toRemove.forEach(id => this._removeById(event, id));
    }

    /**
     * Returns true if the given event has at least one subscriber.
     * @param event - Event name to check.
     * @returns Whether any handlers are subscribed.
     * @since 1.6.0
     */
    hasListeners<K extends keyof TEvents>(event: K): boolean {
        return (this.subs.get(event)?.length ?? 0) > 0;
    }

    /**
     * Returns the number of active subscriptions for the given event.
     * @param event - Event name.
     * @returns Subscription count.
     * @since 1.6.0
     */
    listenerCount<K extends keyof TEvents>(event: K): number {
        return this.subs.get(event)?.length ?? 0;
    }

    /**
     * Remove all subscriptions for a specific event, or all events if no argument given.
     * @param event - Optional event to clear. If omitted, clears everything.
     * @since 1.6.0
     */
    clear<K extends keyof TEvents>(event?: K): void {
        if (event !== undefined) this.subs.delete(event);
        else this.subs.clear();
    }

    /**
     * Returns a diagnostic snapshot of the bus.
     * @returns Bus stats object.
     * @since 1.6.0
     */
    stats(): BusStats {
        /**
 * TODO: describe what this does.
         * @constant perEvent
         * @type {Record<string, number>}
         */
        const perEvent: Record<string, number> = {};
        /**
 * TODO: describe what this does.
         * @variable total
         * @type {number}
         */
        let total = 0;
        for (const [k, v] of this.subs) {
            perEvent[String(k)] = v.length;
            total += v.length;
        }
        return { totalSubscriptions: total, distinctEvents: this.subs.size, perEvent };
    }

    /** Total number of emit() / emitSync() calls made on this bus. */
    get emitCount(): number { return this._emitCount; }

    /**
     * TODO: describe what this does.
     * @param {keyof TEvents} event - TODO: describe parameter "event".
     * @param {number} id - TODO: describe parameter "id".
     * @method _removeById
     * @private
     */
    private _removeById(event: keyof TEvents, id: number): void {
        /**
 * TODO: describe what this does.
         * @constant list
         * @type {any}
         */
        const list = this.subs.get(event);
        if (!list) return;
        /**
 * TODO: describe what this does.
         * @constant idx
         * @type {any}
         */
        const idx = list.findIndex(s => s.id === id);
        if (idx !== -1) list.splice(idx, 1);
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a typed EventBus pre-configured with a given event map.
 * Convenience factory so callers don't need to write the generic parameter.
 *
 * @param _schema - Pass an object literal typed as the event map for inference.
 * @returns A new EventBus typed to those events.
 * @since 1.6.0
 *
 * @example
 * const bus = createEventBus<{ ping: void; pong: { ms: number } }>();
 */
export function createEventBus<TEvents extends Record<string, unknown>>(): EventBus<TEvents> {
    return new EventBus<TEvents>();
}

/**
 * Bridges two buses: re-emits every `event` from `source` onto `target`.
 * Returns an unsubscribe function that removes the bridge.
 *
 * @param source - The bus to listen on.
 * @param target - The bus to forward events to.
 * @param event - Event name to bridge.
 * @returns Unsubscribe function.
 * @since 1.6.0
 */
export function bridgeEvent<TEvents extends Record<string, unknown>, K extends keyof TEvents>(
    source: EventBus<TEvents>,
    target: EventBus<TEvents>,
    event: K
): () => void {
    return source.on(event, (payload) => target.emit(event, payload));
}
