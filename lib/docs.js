"use strict";

/**
 * jsdoc-scribe/docs — programmatic API
 *
 * Use this when you want to drive jsdoc-scribe from Node code rather than
 * the CLI. All lower-level pieces are also exported so you can build a
 * custom renderer on top of the same extraction pipeline.
 *
 * @example
 * const { extractModule, buildSite, collectFiles } = require('jsdoc-scribe/docs');
 *
 * const files = collectFiles('./src');
 * const modules = files.map(f => extractModule(f));
 * const pages = buildSite(modules, { projectName: 'My API', version: '1.0.0' });
 *
 * // pages is [{ path: 'index.html', html: '...' }, { path: 'modules/...html', html: '...' }]
 * pages.forEach(p => require('fs').writeFileSync(require('path').join('./docs', p.path), p.html));
 */

const { collectFiles, DEFAULT_EXTENSIONS, DEFAULT_IGNORE_DIRS } = require("./index.js");
const { extractModule } = require("./extractor.js");
const { buildSite, moduleLabel, moduleHtmlPath } = require("./renderer.js");

/**
 * Extract structured documentation from every file in an array.
 * Skips files that fail to parse and logs the error to stderr.
 * @param {string[]} files - absolute or relative file paths
 * @returns {object[]} array of module models (same shape as extractModule())
 */
function extractModules(files) {
    const modules = [];
    for (const file of files) {
        try {
            modules.push(extractModule(file));
        } catch (err) {
            process.stderr.write(`jsdoc-scribe/docs: skipped ${file} — ${err.message}\n`);
        }
    }
    return modules;
}

/**
 * One-shot: collect files, extract docs, build site, return pages.
 * @param {string|string[]} inputPaths - file or directory paths to scan
 * @param {{ projectName?: string, version?: string, extensions?: string[], ignoreDirs?: Set<string> }} [options]
 * @returns {{ path: string, html: string }[]}
 */
function generateSite(inputPaths, options) {
    const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
    const opts = options || {};
    const files = [].concat(...paths.map(p => collectFiles(p, opts.extensions, opts.ignoreDirs)));
    const unique = [...new Set(files)];
    const modules = extractModules(unique);
    return buildSite(modules, { projectName: opts.projectName, version: opts.version });
}

module.exports = {
    // Core pipeline
    collectFiles,
    extractModule,
    extractModules,
    buildSite,
    generateSite,
    // Helpers
    moduleLabel,
    moduleHtmlPath,
    // Constants
    DEFAULT_EXTENSIONS,
    DEFAULT_IGNORE_DIRS,
};
