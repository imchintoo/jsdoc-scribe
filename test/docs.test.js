"use strict";

/**
 * Unit tests for lib/docs.js -- the public `require("jsdoc-scribe/docs")`
 * programmatic API (see package.json's "./docs" export). Added 2026-07-31:
 * this is the package's documented public entry point for scripted/embedded
 * use, and previously had zero direct test coverage -- every other exported
 * module has its own test/*.test.js file, this one didn't. Focuses on the
 * two functions unique to this wrapper (extractModules, generateSite);
 * collectFiles/buildSite/etc. are re-exports of already-tested functions
 * (lib/index.js's own inline suite in test/run.js, lib/renderer.test.js) --
 * covered here only as an identity/re-export sanity check, not re-tested.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const docsApi = require("../lib/docs.js");
const indexApi = require("../lib/index.js");
const rendererApi = require("../lib/renderer.js");

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(dir, rel, content) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
    return full;
}

module.exports = function runDocsApiTests(check) {

    check("docs.js: re-exports collectFiles/DEFAULT_EXTENSIONS/DEFAULT_IGNORE_DIRS as the exact same references as lib/index.js (not a reimplementation)", () => {
        assert.strictEqual(docsApi.collectFiles, indexApi.collectFiles);
        assert.strictEqual(docsApi.DEFAULT_EXTENSIONS, indexApi.DEFAULT_EXTENSIONS);
        assert.strictEqual(docsApi.DEFAULT_IGNORE_DIRS, indexApi.DEFAULT_IGNORE_DIRS);
    });

    check("docs.js: re-exports buildSite/moduleLabel/moduleHtmlPath as the exact same references as lib/renderer.js", () => {
        assert.strictEqual(docsApi.buildSite, rendererApi.buildSite);
        assert.strictEqual(docsApi.moduleLabel, rendererApi.moduleLabel);
        assert.strictEqual(docsApi.moduleHtmlPath, rendererApi.moduleHtmlPath);
    });

    check("extractModules: parses every valid file and returns one ModuleDoc per file", async () => {
        const dir = tmpDir("cbg-docsapi-em-");
        const a = writeFile(dir, "a.js", "/**\n * Adds.\n * @param {number} x\n * @returns {number}\n */\nfunction add(x) { return x; }\nmodule.exports = { add };\n");
        const b = writeFile(dir, "b.js", "/**\n * Subs.\n * @param {number} x\n * @returns {number}\n */\nfunction sub(x) { return -x; }\nmodule.exports = { sub };\n");
        const modules = await docsApi.extractModules([a, b]);
        assert.strictEqual(modules.length, 2, "expected one ModuleDoc per input file");
        const names = modules.map((m) => m.functions[0].name).sort();
        assert.deepStrictEqual(names, ["add", "sub"]);
    });

    check("extractModules: never throws for one bad file -- skips it, logs to stderr, still returns the good ones", async () => {
        const dir = tmpDir("cbg-docsapi-embad-");
        const good = writeFile(dir, "good.js", "/**\n * Fine.\n */\nfunction fine() {}\nmodule.exports = { fine };\n");
        const missing = path.join(dir, "does-not-exist.js");

        const originalWrite = process.stderr.write;
        let stderrOutput = "";
        process.stderr.write = (chunk) => { stderrOutput += chunk; return true; };
        let modules;
        try {
            modules = await docsApi.extractModules([good, missing]);
        } finally {
            process.stderr.write = originalWrite;
        }
        assert.strictEqual(modules.length, 1, "the bad file must be skipped, not thrown");
        assert.strictEqual(modules[0].functions[0].name, "fine");
        assert.match(stderrOutput, /jsdoc-scribe\/docs: skipped/, "expected the skip to be logged to stderr");
        assert.match(stderrOutput, /does-not-exist\.js/);
    });

    check("extractModules: empty input array resolves to an empty array, not a hang or throw", async () => {
        const modules = await docsApi.extractModules([]);
        assert.deepStrictEqual(modules, []);
    });

    check("generateSite: one-shot collect+extract+build produces a real multi-page site from a directory", async () => {
        const dir = tmpDir("cbg-docsapi-gs-");
        writeFile(dir, "index.js", "/**\n * Entry.\n * @returns {void}\n */\nfunction main() {}\nmodule.exports = { main };\n");
        const pages = await docsApi.generateSite(dir, { projectName: "GenSiteTest" });
        assert.ok(Array.isArray(pages) && pages.length > 0, "expected at least one rendered page");
        const index = pages.find((p) => p.path === "index.html");
        assert.ok(index, "expected an index.html page");
        assert.match(index.html, /GenSiteTest/);
    });

    check("generateSite: accepts a single string path (not just an array), same as an array of one", async () => {
        const dir = tmpDir("cbg-docsapi-gs-single-");
        writeFile(dir, "only.js", "/**\n * Only.\n */\nfunction only() {}\nmodule.exports = { only };\n");
        const pages = await docsApi.generateSite(dir); // string, not [dir]
        assert.ok(pages.some((p) => p.path === "index.html"));
    });

    check("generateSite: rootDir opts in to the Architecture page (facts computed + passed through); omitted rootDir means no Architecture page", async () => {
        const dir = tmpDir("cbg-docsapi-gs-facts-");
        writeFile(dir, "src", ""); // placeholder, overwritten below
        fs.rmSync(path.join(dir, "src"), { force: true });
        writeFile(dir, "src/index.js", "/**\n * Entry.\n */\nfunction main() {}\nmodule.exports = { main };\n");
        // A package.json + a couple of layered dirs so getAllFacts(dir) has
        // at least one real signal to report (bin=CLI tool is the cheapest).
        writeFile(dir, "package.json", JSON.stringify({ name: "facts-fixture", bin: { x: "./bin/x.js" } }));
        writeFile(dir, "bin/x.js", "#!/usr/bin/env node\n");

        const withFacts = await docsApi.generateSite(path.join(dir, "src"), { projectName: "T", rootDir: dir });
        assert.ok(withFacts.some((p) => p.path === "architecture.html"), "rootDir was provided -- expected an architecture.html page");

        const withoutFacts = await docsApi.generateSite(path.join(dir, "src"), { projectName: "T" });
        assert.ok(!withoutFacts.some((p) => p.path === "architecture.html"), "no rootDir -- must not render an architecture.html page");
    });

    check("generateSite: deduplicates files collected from overlapping input paths", async () => {
        const dir = tmpDir("cbg-docsapi-gs-dedupe-");
        writeFile(dir, "a.js", "/**\n * A.\n */\nfunction a() {}\nmodule.exports = { a };\n");
        // Pass the same directory twice -- generateSite's internal `[...new Set(files)]`
        // dedupe must collapse this to one module, not two duplicate pages.
        const pages = await docsApi.generateSite([dir, dir], { projectName: "Dedupe" });
        const modulePages = pages.filter((p) => p.path.startsWith("modules/"));
        assert.strictEqual(modulePages.length, 1, "expected exactly one module page despite the duplicated input path");
    });

};
