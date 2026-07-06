"use strict";

/**
 * Sleep.
 * @param {any} ms - - ms.
 * @returns {any} TODO: describe the return value.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes the backoff ms.
 * @param {any} attempt - - attempt.
 * @param {any} baseMs - - base ms.
 * @param {any} maxMs - - max ms.
 * @returns {any} TODO: describe the return value.
 */
function computeBackoffMs(attempt, baseMs, maxMs) {
    /**
 * TODO: describe what this does.
     * @constant exp
     * @type {any}
     */
    const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    /**
 * TODO: describe what this does.
     * @constant jitter
     * @type {any}
     */
    const jitter = Math.random() * exp * 0.1;
    return Math.round(exp + jitter);
}

/**
 * Retries the .
 * @param {any} fn - - function to invoke.
 * @param {any} options - - configuration options.
 * @throws {err}
 * @throws {lastError}
 * @returns {any} TODO: describe the return value.
 * @async
 */
async function retry(fn, options) {
    /**
 * TODO: describe what this does.
     * @constant opts
     * @type {any}
     */
    const opts = options || {};
    /**
 * TODO: describe what this does.
     * @constant maxAttempts
     * @type {any}
     */
    const maxAttempts = opts.maxAttempts || 3;
    /**
 * TODO: describe what this does.
     * @constant baseMs
     * @type {any}
     */
    const baseMs = opts.baseMs || 200;
    /**
 * TODO: describe what this does.
     * @constant maxMs
     * @type {any}
     */
    const maxMs = opts.maxMs || 5000;
    /**
 * TODO: describe what this does.
     * @constant shouldRetry
     * @type {any}
     */
    const shouldRetry = opts.shouldRetry || (() => true);

    /**
 * TODO: describe what this does.
     * @variable lastError
     * @type {any}
     */
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn(attempt);
        } catch (err) {
            lastError = err;
            if (attempt === maxAttempts - 1 || !shouldRetry(err, attempt)) {
                throw err;
            }
            await sleep(computeBackoffMs(attempt, baseMs, maxMs));
        }
    }
    throw lastError;
}

/**
 * Returns whether the transient is error.
 * @param {any} err - - error instance.
 * @returns {any} TODO: describe the return value.
 */
function isTransientError(err) {
    if (!err) return false;
    /**
 * TODO: describe what this does.
     * @constant code
     * @type {any}
     */
    const code = err.code || "";
    return ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED"].includes(code);
}

/**
 * Represents a circuit breaker.
 */
class CircuitBreaker {
    /**
     * TODO: describe what this does.
     * @param {any} threshold - - threshold.
     * @param {any} resetMs - - reset ms.
     * @constructor
     */
    constructor(threshold, resetMs) {
        this.threshold = threshold || 5;
        this.resetMs = resetMs || 30000;
        this.failureCount = 0;
        this.state = "closed";
        this.openedAt = null;
    }

    /**
     * Executes the .
     * @param {any} fn - - function to invoke.
     * @throws {Error}
     * @throws {err}
     * @returns {any} TODO: describe the return value.
     * @async
     */
    async execute(fn) {
        if (this.state === "open") {
            if (Date.now() - this.openedAt > this.resetMs) {
                this.state = "half-open";
            } else {
                throw new Error("Circuit breaker is open");
            }
        }
        try {
            /**
 * TODO: describe what this does.
             * @constant result
             * @type {any}
             */
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (err) {
            this.onFailure();
            throw err;
        }
    }

    /**
     * Registers a listener for the success event.
     */
    onSuccess() {
        this.failureCount = 0;
        this.state = "closed";
    }

    /**
     * Registers a listener for the failure event.
     */
    onFailure() {
        this.failureCount += 1;
        if (this.failureCount >= this.threshold) {
            this.state = "open";
            this.openedAt = Date.now();
        }
    }
}

module.exports = { retry, isTransientError, computeBackoffMs, CircuitBreaker };
