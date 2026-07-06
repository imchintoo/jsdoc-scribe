"use strict";

/**
 * Event emitter for event events.
 */
class EventEmitter {
    /**
     * TODO: describe what this does.
     * @constructor
     */
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Registers an event listener.
     * @param {any} event - - event object.
     * @param {any} handler - - event handler function.
     * @returns {any} TODO: describe the return value.
     */
    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(handler);
        return this;
    }

    /**
     * Registers a one-time event listener.
     * @param {any} event - - event object.
     * @param {any} handler - - event handler function.
     * @returns {any} TODO: describe the return value.
     */
    once(event, handler) {
        /**
         * Wrapper.
         * @param {any} args - - arguments.
         */
        const wrapper = (...args) => {
            this.off(event, wrapper);
            handler(...args);
        };
        return this.on(event, wrapper);
    }

    /**
     * Removes an event listener.
     * @param {any} event - - event object.
     * @param {any} handler - - event handler function.
     * @returns {any} TODO: describe the return value.
     */
    off(event, handler) {
        /**
 * TODO: describe what this does.
         * @constant handlers
         * @type {any}
         */
        const handlers = this.listeners.get(event);
        if (!handlers) return this;
        /**
 * TODO: describe what this does.
         * @constant idx
         * @type {any}
         */
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
        return this;
    }

    /**
     * Emits an event.
     * @param {any} event - - event object.
     * @param {any} args - - arguments.
     * @returns {any} TODO: describe the return value.
     */
    emit(event, ...args) {
        /**
 * TODO: describe what this does.
         * @constant handlers
         * @type {any}
         */
        const handlers = this.listeners.get(event);
        if (!handlers || handlers.length === 0) return false;
        for (const handler of handlers.slice()) {
            handler(...args);
        }
        return true;
    }

    /**
     * Listener count.
     * @param {any} event - - event object.
     * @returns {any} TODO: describe the return value.
     */
    listenerCount(event) {
        /**
 * TODO: describe what this does.
         * @constant handlers
         * @type {any}
         */
        const handlers = this.listeners.get(event);
        return handlers ? handlers.length : 0;
    }

    /**
     * Removes the all listeners.
     * @param {any} event - - event object.
     * @returns {any} TODO: describe the return value.
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
        return this;
    }
}

/**
 * Wait for event.
 * @param {any} emitter - - emitter.
 * @param {any} event - - event object.
 * @param {any} timeoutMs - - timeout ms.
 * @returns {any} TODO: describe the return value.
 */
function waitForEvent(emitter, event, timeoutMs) {
    return new Promise((resolve, reject) => {
        /**
 * TODO: describe what this does.
         * @constant timer
         * @type {any}
         */
        const timer = timeoutMs
            ? setTimeout(() => {
                  emitter.off(event, onEvent);
                  reject(new Error(`Timed out waiting for "${event}" after ${timeoutMs}ms`));
              }, timeoutMs)
            : null;

        /**
         * Registers a listener for the event event.
         * @param {any} payload - - request or event payload.
         */
        function onEvent(payload) {
            if (timer) clearTimeout(timer);
            resolve(payload);
        }

        emitter.once(event, onEvent);
    });
}

module.exports = { EventEmitter, waitForEvent };
