/**
 * TODO: describe what this does.
 * @deprecated Use the individual arithmetic functions instead.
 * @param {number} a - TODO: describe parameter "a".
 * @param {number} b - TODO: describe parameter "b".
 * @param {string} operation - add | sub | mul | div.
 * @returns {number} TODO: describe the return value.
 * @function calculator
 */
function calculator(a, b, operation) {
    if (operation === "add") return a + b;
    if (operation === "sub") return a - b;
    if (operation === "mul") return a * b;
    if (operation === "div") return a / b;
}

/**
 * Capitalizes the first character of a string.
 * @param {string} str - The input string to capitalize.
 * @returns {string} The capitalized string.
 * @since 1.0.0
 */
export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a maximum length, appending a suffix if cut.
 *
 * @param {string} str - The string to truncate.
 * @param {number} [maxLength] - Maximum character length (default 80).
 * @param {string} [suffix] - Appended when truncated (default "...").
 * @returns {string} The truncated string.
 * @since 1.0.0
 *
 * @example
 * truncate("Hello, world!", 8) // => "Hello..."
 */
export function truncate(str, maxLength = 80, suffix = "...") {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Converts a string to a URL-safe slug (lowercase, hyphens).
 * @param {any} str - TODO: describe parameter "str".
 * @returns {any} TODO: describe the return value.
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Splits an array into chunks of the given size.
 * @param {any} arr - TODO: describe parameter "arr".
 * @param {any} size - TODO: describe parameter "size".
 * @returns {any} TODO: describe the return value.
 */
export const chunk = (arr, size) => {
    /**
 * TODO: describe what this does.
     * @constant result
     * @type {Array}
     */
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
};

/**
 * Returns a new array with duplicate values removed.
 * @param {any} arr - TODO: describe parameter "arr".
 * @returns {any} TODO: describe the return value.
 */
export const unique = (arr) => [...new Set(arr)];

/**
 * Groups an array into an object keyed by the result of keyFn.
 * @param {any} arr - TODO: describe parameter "arr".
 * @param {any} keyFn - TODO: describe parameter "keyFn".
 * @returns {any} TODO: describe the return value.
 */
export const groupBy = (arr, keyFn) => {
    return arr.reduce((acc, item) => {
        /**
 * TODO: describe what this does.
         * @constant key
         * @type {any}
         */
        const key = keyFn(item);
        (acc[key] = acc[key] || []).push(item);
        return acc;
    }, {});
};

/**
 * Retries an async function up to `attempts` times with a delay between tries.
 *
 * @param {Function} fn - Async function to attempt.
 * @param {number} [attempts] - Max number of attempts (default 3).
 * @param {number} [delayMs] - Delay between retries in ms (default 300).
 * @returns {Promise<any>} Resolves with the fn result.
 * @throws {Error} Re-throws the last error if all attempts fail.
 * @since 1.1.0
 *
 * @example
 * const data = await retry(() => fetch("/api/data").then(r => r.json()), 3, 500);
 */
export async function retry(fn, attempts = 3, delayMs = 300) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === attempts - 1) throw err;
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}

/**
 * Async generator that pages through results until an empty page is returned.
 * @param {any} fetchPage - TODO: describe parameter "fetchPage".
 * @param {number} [startPage] - TODO: describe parameter "startPage".
 */
export async function* paginate(fetchPage, startPage = 1) {
    /**
 * TODO: describe what this does.
     * @variable page
     * @type {any}
     */
    let page = startPage;
    while (true) {
        /**
 * TODO: describe what this does.
         * @constant items
         * @type {any}
         */
        const items = await fetchPage(page++);
        if (!items || items.length === 0) break;
        yield* items;
    }
}

/**
 * Deep-clones a JSON-serializable value.
 * @param {any} obj - TODO: describe parameter "obj".
 * @returns {any} TODO: describe the return value.
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Returns a new object with only the specified keys.
 * @param {any} obj - TODO: describe parameter "obj".
 * @param {any} keys - TODO: describe parameter "keys".
 * @returns {any} TODO: describe the return value.
 */
export const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

/**
 * Returns a new object without the specified keys.
 * @param {any} obj - TODO: describe parameter "obj".
 * @param {any} keys - TODO: describe parameter "keys".
 * @returns {any} TODO: describe the return value.
 */
export const omit = (obj, keys) => {
    /**
 * TODO: describe what this does.
     * @constant s
     * @type {Set}
     */
    const s = new Set(keys);
    return Object.fromEntries(Object.entries(obj).filter(([k]) => !s.has(k)));
};

/**
 * Clamps a number between min and max (inclusive).
 * @param {any} n - TODO: describe parameter "n".
 * @param {any} min - TODO: describe parameter "min".
 * @param {any} max - TODO: describe parameter "max".
 * @returns {any} TODO: describe the return value.
 */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * Linear interpolation between two values.
 * @param {any} a - TODO: describe parameter "a".
 * @param {any} b - TODO: describe parameter "b".
 * @param {any} t - TODO: describe parameter "t".
 * @returns {any} TODO: describe the return value.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Sum of all numbers in an array.
 * @param {any} arr - TODO: describe parameter "arr".
 * @returns {any} TODO: describe the return value.
 */
export const sum = (arr) => arr.reduce((acc, n) => acc + n, 0);

/**
 * Arithmetic mean of an array of numbers.
 * @param {any} arr - TODO: describe parameter "arr".
 * @returns {any} TODO: describe the return value.
 */
export const mean = (arr) => sum(arr) / arr.length;

/** Maximum number of retry attempts used by retry(). */
export const MAX_RETRIES = 3;

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 5000;

/** Current library version string. */
export const VERSION = "1.0.0";
