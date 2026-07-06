"use strict";

/**
 * TODO: describe what this does.
 * @constant LEVELS
 * @type {Object}
 */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Represents a logger.
 */
class Logger {
    /**
     * TODO: describe what this does.
     * @param {any} name - - display name.
     * @param {any} minLevel - - min level.
     * @constructor
     */
    constructor(name, minLevel) {
        this.name = name;
        this.minLevel = minLevel || "info";
        this.history = [];
    }

    /**
     * Determines whether the log.
     * @param {any} level - - level.
     * @returns {any} TODO: describe the return value.
     */
    shouldLog(level) {
        return LEVELS[level] >= LEVELS[this.minLevel];
    }

    /**
     * Formats the .
     * @param {any} level - - level.
     * @param {any} message - - descriptive message.
     * @returns {any} TODO: describe the return value.
     */
    format(level, message) {
        /**
 * TODO: describe what this does.
         * @constant ts
         * @type {any}
         */
        const ts = new Date().toISOString();
        return `${ts} [${level.toUpperCase()}] (${this.name}) ${message}`;
    }

    /**
     * Debug.
     * @param {any} message - descriptive message.
     */
    debug(message) {
        if (!this.shouldLog("debug")) return;
        /**
 * TODO: describe what this does.
         * @constant line
         * @type {any}
         */
        const line = this.format("debug", message);
        this.history.push(line);
        console.debug(line);
    }

    /**
     * Info.
     * @param {any} message - descriptive message.
     */
    info(message) {
        if (!this.shouldLog("info")) return;
        /**
 * TODO: describe what this does.
         * @constant line
         * @type {any}
         */
        const line = this.format("info", message);
        this.history.push(line);
        console.info(line);
    }

    /**
     * Emits a warning for the .
     * @param {any} message - descriptive message.
     */
    warn(message) {
        if (!this.shouldLog("warn")) return;
        /**
 * TODO: describe what this does.
         * @constant line
         * @type {any}
         */
        const line = this.format("warn", message);
        this.history.push(line);
        console.warn(line);
    }

    /**
     * Error.
     * @param {any} message - descriptive message.
     * @param {any} err - error instance.
     */
    error(message, err) {
        if (!this.shouldLog("error")) return;
        /**
 * TODO: describe what this does.
         * @constant line
         * @type {any}
         */
        const line = this.format("error", message) + (err ? ` :: ${err.stack || err.message}` : "");
        this.history.push(line);
        console.error(line);
    }

    /**
     * Child.
     * @param {any} suffix - - string suffix.
     * @returns {any} TODO: describe the return value.
     */
    child(suffix) {
        return new Logger(`${this.name}:${suffix}`, this.minLevel);
    }

    /**
     * Returns the history.
     * @returns {any} TODO: describe the return value.
     */
    getHistory() {
        return this.history.slice();
    }

    /**
     * Clears the history.
     */
    clearHistory() {
        this.history = [];
    }
}

/**
 * Creates a new logger.
 * @param {any} name - - display name.
 * @param {any} minLevel - - min level.
 * @returns {any} TODO: describe the return value.
 */
function createLogger(name, minLevel) {
    return new Logger(name, minLevel);
}

module.exports = { Logger, createLogger, LEVELS };
