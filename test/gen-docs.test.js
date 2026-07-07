"use strict";

/**
 * CLI-level tests for bin/gen-docs.js's --data / --from-data flags
 * (story-file-detail-redesign). Spawns the real CLI, same pattern as
 * test/cli.test.js does for bin/cli.js -- bin/gen-docs.js had no dedicated
 * test file before this story (its behavior was only ever exercised
 * indirectly via lib/renderer.js's buildSite() unit tests).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { execFileSync } = require("child_process");

const GEN_DOCS = path.join(__dirname, "..", "bin", "gen-docs.js");

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function run(args, opts) {
    try {
        const out = execFileSync(process.execPath, [GEN_DOCS, ...args], Object.assign({ encoding: "utf8" }, opts || {}));
        return { status: 0, stdout: out };
    } catch (err) {
        return { status: err.status, stdout: (err.stdout || "") + (err.stderr || "") };
    }
}

function fixtureDir() {
    const dir = tmpDir("scribe-gendocs-src-");
    fs.writeFileSync(
        path.join(dir, "sample.js"),
        "/**\n * Adds two numbers.\n * @param {number} a - first\n * @param {number} b - second\n * @returns {number} the sum\n */\nfunction add(a, b) {\n  return a + b;\n}\nmodule.exports = { add };\n",
        "utf8",
    );
    return dir;
}

// story-doc-version-switcher: a fixture variant whose extracted module content
// actually differs run-to-run (an extra exported function), so successive
// --data generations produce genuinely distinct site-data.json payloads --
// not just distinct timestamps -- matching the real-world scenario from the
// product-owner intake (code changed a week later, docs regenerated).
function fixtureDirRevision(revision) {
    const dir = tmpDir("scribe-gendocs-src-rev-");
    let body = "/**\n * Adds two numbers.\n * @param {number} a - first\n * @param {number} b - second\n * @returns {number} the sum\n */\nfunction add(a, b) {\n  return a + b;\n}\n";
    if (revision >= 2) {
        body += "/**\n * Subtracts b from a.\n * @param {number} a - first\n * @param {number} b - second\n * @returns {number} the difference\n */\nfunction subtract(a, b) {\n  return a - b;\n}\n";
    }
    if (revision >= 3) {
        body += "/**\n * Multiplies two numbers.\n * @param {number} a - first\n * @param {number} b - second\n * @returns {number} the product\n */\nfunction multiply(a, b) {\n  return a * b;\n}\n";
    }
    const exportsList = revision >= 3 ? "{ add, subtract, multiply }" : revision >= 2 ? "{ add, subtract }" : "{ add }";
    body += `module.exports = ${exportsList};\n`;
    fs.writeFileSync(path.join(dir, "sample.js"), body, "utf8");
    return dir;
}

module.exports = function runGenDocsTests(check) {

    check("gen-docs --data: writes site-data.json alongside the normal site", () => {
        const src = fixtureDir();
        const out = tmpDir("scribe-gendocs-out-");
        const res = run([src, "--out", out, "--data"]);
        assert.strictEqual(res.status, 0, res.stdout);
        const dataPath = path.join(out, "site-data.json");
        assert.ok(fs.existsSync(dataPath), "site-data.json was not written");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        assert.ok(Array.isArray(data.modules) && data.modules.length === 1, "expected 1 module in site-data.json");
        assert.strictEqual(data.quality, null, "quality should be null when --quality wasn't passed");
        assert.ok(fs.existsSync(path.join(out, "index.html")), "normal site output missing");
    });

    check("gen-docs --data twice into the same --out: second run preserves the first generation, never overwrites silently", () => {
        const src = fixtureDir();
        const out = tmpDir("scribe-gendocs-outhist-");
        run([src, "--out", out, "--data"]);
        const firstRaw = fs.readFileSync(path.join(out, "site-data.json"), "utf8");
        // Second run (fixture unchanged is fine -- history preservation is about
        // never clobbering the previous FILE, not about the content differing).
        const res2 = run([src, "--out", out, "--data"]);
        assert.strictEqual(res2.status, 0, res2.stdout);
        assert.ok(/preserved prior generation/.test(res2.stdout), "expected a 'preserved prior generation' log line on the second run");
        const histDir = path.join(out, "site-data-history");
        assert.ok(fs.existsSync(histDir), "site-data-history/ was not created");
        const histFiles = fs.readdirSync(histDir);
        assert.strictEqual(histFiles.length, 1, "expected exactly 1 preserved file after 2 writes");
        assert.strictEqual(fs.readFileSync(path.join(histDir, histFiles[0]), "utf8"), firstRaw, "preserved file should match the first generation's exact content");
    });

    check("gen-docs --from-data: renders a full site from a previously-written site-data.json, no positional inputs needed", () => {
        const src = fixtureDir();
        const out1 = tmpDir("scribe-gendocs-src-out-");
        run([src, "--out", out1, "--quality", "--data", "--title", "FromDataTest"]);
        const dataPath = path.join(out1, "site-data.json");

        const out2 = tmpDir("scribe-gendocs-fromdata-out-");
        const res = run(["--from-data", dataPath, "--out", out2]);
        assert.strictEqual(res.status, 0, res.stdout);
        assert.ok(fs.existsSync(path.join(out2, "index.html")), "index.html missing from --from-data output");

        // Byte-identical modulo nothing observable here (this fixture has no
        // snapshot/generatedAt-sensitive content in the module body) --
        // confirms --from-data reproduces the exact same site.
        const modPages1 = fs.readdirSync(path.join(out1, "modules"));
        const modPages2 = fs.readdirSync(path.join(out2, "modules"));
        assert.deepStrictEqual(modPages1.sort(), modPages2.sort(), "module page filenames should match");
        for (const f of modPages1) {
            assert.strictEqual(
                fs.readFileSync(path.join(out1, "modules", f), "utf8"),
                fs.readFileSync(path.join(out2, "modules", f), "utf8"),
                `module page ${f} should be byte-identical between the original run and --from-data`,
            );
        }
    });

    check("gen-docs --from-data: missing file exits non-zero with a clear message, not a raw stack trace", () => {
        const out = tmpDir("scribe-gendocs-missing-");
        const res = run(["--from-data", path.join(out, "does-not-exist.json"), "--out", out]);
        assert.notStrictEqual(res.status, 0);
        assert.ok(/Could not read site-data file/.test(res.stdout), "expected the clear site-data error message, got: " + res.stdout);
        assert.ok(!/at Object\.<anonymous>/.test(res.stdout), "should not leak a raw Node stack trace");
    });

    check("gen-docs --from-data: malformed site-data.json exits non-zero with a clear message", () => {
        const out = tmpDir("scribe-gendocs-badjson-");
        const badPath = path.join(out, "site-data.json");
        fs.writeFileSync(badPath, "{ not valid json", "utf8");
        const res = run(["--from-data", badPath, "--out", out]);
        assert.notStrictEqual(res.status, 0);
        assert.ok(/not valid JSON|site-data file/.test(res.stdout), "expected a site-data-specific error message, got: " + res.stdout);
    });

    check("gen-docs: plain run (no --data/--from-data) is completely unaffected -- no site-data.json written", () => {
        const src = fixtureDir();
        const out = tmpDir("scribe-gendocs-plain-");
        const res = run([src, "--out", out]);
        assert.strictEqual(res.status, 0, res.stdout);
        assert.ok(!fs.existsSync(path.join(out, "site-data.json")), "site-data.json should not exist without --data");
        assert.ok(fs.existsSync(path.join(out, "index.html")));
    });

    // -- story-doc-version-switcher (TICKET-7, qa-automation-engineer) --------

    check("gen-docs --data: a fresh --out with no prior history renders the single-static-span shape (no menu, no site-versions/)", () => {
        const src = fixtureDirRevision(1);
        const out = tmpDir("scribe-gendocs-vs-fresh-");
        const res = run([src, "--out", out, "--data"]);
        assert.strictEqual(res.status, 0, res.stdout);
        const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
        assert.ok(/<span class="version-switcher-static">Current<\/span>/.test(html), "expected the empty-state static span, got: " + html.slice(0, 400));
        assert.ok(!/version-switcher-menu/.test(html), "no history yet -- should not render a switcher menu");
        assert.ok(!fs.existsSync(path.join(out, "site-versions")), "site-versions/ should not exist before any generation has been evicted to history");
    });

    check("gen-docs --data: three successive runs with real content changes produce Current + 2 distinct, correctly-ordered history entries", () => {
        const out = tmpDir("scribe-gendocs-vs-three-");
        run([fixtureDirRevision(1), "--out", out, "--data"]);
        run([fixtureDirRevision(2), "--out", out, "--data"]);
        run([fixtureDirRevision(3), "--out", out, "--data"]);

        const histDir = path.join(out, "site-data-history");
        const histFiles = fs.readdirSync(histDir).filter((f) => f.endsWith(".json"));
        assert.strictEqual(histFiles.length, 2, "expected exactly 2 evicted history entries after 3 writes");

        // Real, differing content -- not just differing timestamps: the 3 revisions
        // have 1/2/3 exported functions respectively, so the two preserved history
        // entries should reflect revisions 1 and 2 (revision 3 is the live "Current").
        const histModuleCounts = histFiles
            .map((f) => JSON.parse(fs.readFileSync(path.join(histDir, f), "utf8")))
            .map((d) => d.modules[0].functions.length)
            .sort();
        assert.deepStrictEqual(histModuleCounts, [1, 2], "expected the two preserved generations to have 1 and 2 functions respectively");

        const liveData = JSON.parse(fs.readFileSync(path.join(out, "site-data.json"), "utf8"));
        assert.strictEqual(liveData.modules[0].functions.length, 3, "live site-data.json should reflect the 3rd (current) revision");

        const versionDirs = fs.readdirSync(path.join(out, "site-versions")).sort();
        assert.strictEqual(versionDirs.length, 2, "expected exactly 2 rendered site-versions/ snapshots");

        const liveHtml = fs.readFileSync(path.join(out, "index.html"), "utf8");
        const menuItems = liveHtml.match(/version-switcher-item[^<]*<\/a>/g) || [];
        assert.strictEqual(menuItems.length, 3, "expected Current + 2 history entries in the live switcher menu, got: " + JSON.stringify(menuItems));
        // Most-recent-first ordering: Current, then the newer history entry, then the older.
        assert.ok(/is-current[^>]*>Current<\/a>/.test(menuItems[0]), "first item should be the current, is-current entry");
    });

    check("gen-docs --data: render-only-missing -- a snapshot already on disk is never re-rendered on later runs", () => {
        const out = tmpDir("scribe-gendocs-vs-immutable-");
        run([fixtureDirRevision(1), "--out", out, "--data"]);
        run([fixtureDirRevision(2), "--out", out, "--data"]);
        const versionDirs = fs.readdirSync(path.join(out, "site-versions"));
        assert.strictEqual(versionDirs.length, 1, "expected exactly 1 snapshot after the 2nd run");
        const snapshotIndex = path.join(out, "site-versions", versionDirs[0], "index.html");
        const before = fs.statSync(snapshotIndex).mtimeMs;
        const beforeContent = fs.readFileSync(snapshotIndex, "utf8");

        // Third run adds a NEW history entry -- the snapshot from run 2 must not
        // be touched (render-only-missing per the architect's cost decision, and
        // the deliberate non-pre-rendering of the CURRENT generation's own
        // snapshot -- see the backend-engineer sign-off's disclosed deviation).
        run([fixtureDirRevision(3), "--out", out, "--data"]);
        const after = fs.statSync(snapshotIndex).mtimeMs;
        const afterContent = fs.readFileSync(snapshotIndex, "utf8");
        assert.strictEqual(before, after, "existing snapshot's mtime should be unchanged -- it must not be re-rendered");
        assert.strictEqual(beforeContent, afterContent, "existing snapshot's content should be byte-identical -- it must not be re-rendered");
    });

    check("gen-docs --data: version-switcher cross-links between a snapshot page and Current/siblings, with correct aria-current on each", () => {
        const out = tmpDir("scribe-gendocs-vs-crosslink-");
        run([fixtureDirRevision(1), "--out", out, "--data"]);
        run([fixtureDirRevision(2), "--out", out, "--data"]);
        run([fixtureDirRevision(3), "--out", out, "--data"]);

        const versionDirs = fs.readdirSync(path.join(out, "site-versions")).sort(); // oldest first (ISO strings sort lexically)
        assert.strictEqual(versionDirs.length, 2);
        const [olderId, newerId] = versionDirs;

        // The newer snapshot (rendered on run 3, when both history entries already
        // existed) should link to Current, to itself (is-current/aria-current), and
        // to the older snapshot.
        const newerHtml = fs.readFileSync(path.join(out, "site-versions", newerId, "index.html"), "utf8");
        assert.ok(new RegExp('href="\\.\\./\\.\\./index\\.html"[^>]*role="menuitem"(?![^<]*aria-current)').test(newerHtml), "newer snapshot should link to Current (not marked current)");
        assert.ok(new RegExp(`version-switcher-item is-current" href="\\.\\./\\.\\./site-versions/${newerId}/index\\.html" role="menuitem" aria-current="page"`).test(newerHtml), "newer snapshot should mark itself as is-current/aria-current in its own switcher");
        assert.ok(newerHtml.includes(`site-versions/${olderId}/index.html`), "newer snapshot should also link to the older sibling snapshot");

        // The live index links to Current (itself, is-current) plus both snapshots, neither marked current.
        const liveHtml = fs.readFileSync(path.join(out, "index.html"), "utf8");
        assert.ok(/version-switcher-item is-current" href="index\.html" role="menuitem" aria-current="page"/.test(liveHtml), "live index should mark Current as is-current/aria-current");
        assert.ok(liveHtml.includes(`site-versions/${newerId}/index.html`) && liveHtml.includes(`site-versions/${olderId}/index.html`), "live index should link to both snapshots");
    });

    check("gen-docs --data: version switcher degrades to zero-JS native <details>/<summary> (no <select>, no inline script)", () => {
        const out = tmpDir("scribe-gendocs-vs-nojs-");
        run([fixtureDirRevision(1), "--out", out, "--data"]);
        run([fixtureDirRevision(2), "--out", out, "--data"]);
        const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
        assert.ok(/<details class="version-switcher">/.test(html), "expected a native <details> switcher");
        assert.ok(/<summary class="version-switcher-trigger">/.test(html), "expected a native <summary> trigger");
        assert.ok(!/<select[ >]/.test(html), "should never use <select> for the switcher, per this codebase's zero-JS precedent");
        assert.ok(!/onclick=|addEventListener\(.version-switcher/.test(html), "switcher should require no JS wiring to open/close");
    });

    check("gen-docs --data: version-switcher-menu CSS caps height at 320px with scroll (long history lists stay usable)", () => {
        const out = tmpDir("scribe-gendocs-vs-css-");
        run([fixtureDirRevision(1), "--out", out, "--data"]);
        const css = fs.readFileSync(path.join(out, "assets", "style.css"), "utf8");
        assert.ok(/\.version-switcher-menu\{[^}]*max-height:320px/.test(css), "expected .version-switcher-menu{...max-height:320px...} in assets/style.css");
    });

};
