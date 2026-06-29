"use strict";

const fs   = require("fs");
const path = require("path");

const CONFIG_FILENAME = ".jsdoc-scribe.json";

/**
 * Load and return config from `configPath` (default: cwd/.jsdoc-scribe.json).
 * Returns an empty object if the file doesn't exist.
 *
 * @param {string} [configPath] - Explicit path to config file.
 * @returns {{ out?, title?, theme?, json?, readme?, ignore?, sourceUrl? }}
 */
function loadConfig(configPath) {
    const p = configPath || path.resolve(process.cwd(), CONFIG_FILENAME);
    if (!fs.existsSync(p)) return {};
    try {
        const raw = fs.readFileSync(p, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        process.stderr.write(`jsdoc-scribe: failed to parse config at ${p}: ${err.message}\n`);
        return {};
    }
}

/**
 * Merge config file values with CLI args.
 * CLI args take precedence over config file (explicit undefined values are skipped).
 *
 * @param {object} fileConfig - Values from .jsdoc-scribe.json
 * @param {object} cliArgs    - Values parsed from argv (undefined = not set)
 * @returns {object} Merged options object
 */
function mergeConfig(fileConfig, cliArgs) {
    return {
        out:       cliArgs.out       ?? fileConfig.out       ?? null,
        title:     cliArgs.title     ?? fileConfig.title     ?? null,
        theme:     cliArgs.theme     ?? fileConfig.theme     ?? "default",
        json:      cliArgs.json      ?? fileConfig.json      ?? false,
        readme:    cliArgs.readme    ?? fileConfig.readme    ?? false,
        sourceUrl: cliArgs.sourceUrl ?? fileConfig.sourceUrl ?? null,
        ignore:    [...(fileConfig.ignore || []), ...(cliArgs.ignore || [])],
    };
}

module.exports = { loadConfig, mergeConfig, CONFIG_FILENAME };
