"use strict";

const { collectFiles, DEFAULT_EXTENSIONS, DEFAULT_IGNORE_DIRS } = require("./index.js");
const { extractModule } = require("./extractor.js");
const { buildSite, moduleLabel, moduleHtmlPath } = require("./renderer.js");
const { getAllFacts } = require("./project-facts.js");

/**
 * Extract documentation models from an array of file paths.
 * All files are attempted; failures are logged to stderr and omitted from results.
 * Uses Promise.allSettled so a single bad file never aborts the batch.
 *
 * @param {string[]} files
 * @returns {Promise<object[]>}
 */
async function extractModules(files) {
    const results = await Promise.allSettled(
        files.map(f => Promise.resolve().then(() => extractModule(f)))
    );
    const modules = [];
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "fulfilled") {
            modules.push(r.value);
        } else {
            process.stderr.write("jsdoc-scribe/docs: skipped " + files[i] + ": " + r.reason.message + "\n");
        }
    }
    return modules;
}

/**
 * One-shot convenience: collect files, extract docs, build HTML site.
 *
 * @param {string|string[]} inputPaths  Source file or directory paths
 * @param {object} [options]            Same options as buildSite(), plus an
 *   opt-in `rootDir` (task-arch-04): when provided, `getAllFacts(rootDir)` is
 *   computed and passed through as `facts` so the generated site includes the
 *   Architecture page. Omitted/falsy `rootDir` (every pre-task-arch-04 caller)
 *   leaves `facts` undefined -- `buildSite()` treats that as "no Architecture
 *   page", so this is fully backward-compatible.
 * @returns {Promise<Array<{path:string,html:string}>>}
 */
async function generateSite(inputPaths, options) {
    const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
    const opts = options || {};
    const files = [].concat(...paths.map(p => collectFiles(p, opts.extensions, opts.ignoreDirs)));
    const unique = [...new Set(files)];
    const modules = await extractModules(unique);
    const facts = opts.rootDir ? getAllFacts(opts.rootDir) : undefined;
    return buildSite(modules, { projectName: opts.projectName, version: opts.version, facts });
}

module.exports = {
    collectFiles,
    extractModule,
    extractModules,
    buildSite,
    generateSite,
    moduleLabel,
    moduleHtmlPath,
    DEFAULT_EXTENSIONS,
    DEFAULT_IGNORE_DIRS,
};
