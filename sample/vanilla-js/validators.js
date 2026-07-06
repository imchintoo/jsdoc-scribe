"use strict";

/**
 * TODO: describe what this does.
 * @constant EMAIL_RE
 * @type {any}
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns whether the valid is email.
 * @param {any} value - - value to process.
 * @returns {any} TODO: describe the return value.
 */
function isValidEmail(value) {
    return typeof value === "string" && EMAIL_RE.test(value);
}

/**
 * Returns whether the non empty is string.
 * @param {any} value - - value to process.
 * @returns {any} TODO: describe the return value.
 */
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Returns whether the in is range.
 * @param {any} value - - value to process.
 * @param {any} min - - minimum allowed value.
 * @param {any} max - - maximum allowed value.
 * @returns {any} TODO: describe the return value.
 */
function isInRange(value, min, max) {
    return typeof value === "number" && value >= min && value <= max;
}

/**
 * Asserts that the  is correct.
 * @param {any} condition - - condition.
 * @param {any} message - - descriptive message.
 * @throws {Error}
 */
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

/**
 * Result encapsulating validation.
 */
class ValidationResult {
    /**
     * TODO: describe what this does.
     * @constructor
     */
    constructor() {
        this.errors = [];
    }

    /**
     * Adds the error.
     * @param {any} field - - field.
     * @param {any} message - - descriptive message.
     * @returns {any} TODO: describe the return value.
     */
    addError(field, message) {
        this.errors.push({ field, message });
        return this;
    }

    /**
     * Returns the is valid.
     * @returns {any}
     */
    get isValid() {
        return this.errors.length === 0;
    }

    /**
     * To string.
     * @returns {any} TODO: describe the return value.
     */
    toString() {
        return this.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
    }
}

/**
 * Validates the user input.
 * @param {any} input - - input value.
 * @returns {any} TODO: describe the return value.
 */
function validateUserInput(input) {
    /**
 * TODO: describe what this does.
     * @constant result
     * @type {ValidationResult}
     */
    const result = new ValidationResult();
    if (!isNonEmptyString(input.name)) {
        result.addError("name", "name is required");
    }
    if (!isValidEmail(input.email)) {
        result.addError("email", "must be a valid email address");
    }
    if (input.age !== undefined && !isInRange(input.age, 0, 130)) {
        result.addError("age", "must be between 0 and 130");
    }
    return result;
}

module.exports = { isValidEmail, isNonEmptyString, isInRange, assert, ValidationResult, validateUserInput };
