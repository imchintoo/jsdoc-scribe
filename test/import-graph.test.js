"use strict";

/**
 * Import-graph unit tests — tests lib/import-graph.js against real tmp
 * fixture files (not hand-built moduleData, since this module does its own
 * parsing rather than consuming extractModule() output — see
 * docs/backlog/task-pj-01-import-graph.md for why).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { buildImportGraph, findOrphanFiles, extractSpecifiers } = require("../lib/import-graph.js");

function tmpDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "cbg-importgraph-"));
}

module.exports = function runImportGraphTests(check) {

    check("extractSpecifiers: finds CommonJS require() specifiers", () => {
        const dir = tmpDir();
        const file = path.join(dir, "a.js");
        fs.writeFileSync(file, 'const fs = require("fs");\nconst { b } = require("./b.js");\n');
        const specs = extractSpecifiers(file);
        assert.deepStrictEqual(specs, ["fs", "./b.js"]);
    });

    check("extractSpecifiers: finds ESM import/export specifiers", () => {
        const dir = tmpDir();
        const file = path.join(dir, "a.js");
        fs.writeFileSync(file, 'import { b } from "./b.js";\nexport { c } from "./c.js";\n');
        const specs = extractSpecifiers(file);
        assert.deepStrictEqual(specs, ["./b.js", "./c.js"]);
    });

    check("buildImportGraph: builds edges only between files in the given set", () => {
        const dir = tmpDir();
        const a = path.join(dir, "a.js");
        const b = path.join(dir, "b.js");
        fs.writeFileSync(a, 'const b = require("./b.js");\nconst fs = require("fs");\n');
        fs.writeFileSync(b, "module.exports = {};\n");
        const graph = buildImportGraph([a, b]);
        assert.strictEqual(graph.edges.length, 1, "only the ./b.js edge should be recorded, not the external 'fs' require");
        assert.strictEqual(graph.edges[0].from, a);
        assert.strictEqual(graph.edges[0].to, b);
    });

    check("buildImportGraph: in-degree counts how many times a file is imported", () => {
        const dir = tmpDir();
        const shared = path.join(dir, "shared.js");
        const a = path.join(dir, "a.js");
        const b = path.join(dir, "b.js");
        fs.writeFileSync(shared, "module.exports = {};\n");
        fs.writeFileSync(a, 'require("./shared.js");\n');
        fs.writeFileSync(b, 'require("./shared.js");\n');
        const graph = buildImportGraph([shared, a, b]);
        assert.strictEqual(graph.inDegree[shared], 2);
        assert.strictEqual(graph.inDegree[a], 0);
        assert.strictEqual(graph.inDegree[b], 0);
    });

    check("findOrphanFiles: flags zero-in-degree files not in the entry-point list", () => {
        const dir = tmpDir();
        const entry = path.join(dir, "entry.js");
        const used = path.join(dir, "used.js");
        const orphan = path.join(dir, "orphan.js");
        fs.writeFileSync(entry, 'require("./used.js");\n');
        fs.writeFileSync(used, "module.exports = {};\n");
        fs.writeFileSync(orphan, "module.exports = {};\n");
        const graph = buildImportGraph([entry, used, orphan]);
        const orphans = findOrphanFiles(graph, [entry]);
        assert.deepStrictEqual(orphans, [orphan]);
    });

    check("findOrphanFiles: entry points themselves are never flagged even with in-degree 0", () => {
        const dir = tmpDir();
        const entryA = path.join(dir, "entryA.js");
        const entryB = path.join(dir, "entryB.js");
        fs.writeFileSync(entryA, "module.exports = {};\n");
        fs.writeFileSync(entryB, "module.exports = {};\n");
        const graph = buildImportGraph([entryA, entryB]);
        const orphans = findOrphanFiles(graph, [entryA, entryB]);
        assert.deepStrictEqual(orphans, []);
    });

    check("buildImportGraph: resolves extensionless relative requires (index.js)", () => {
        const dir = tmpDir();
        fs.mkdirSync(path.join(dir, "sub"));
        const a = path.join(dir, "a.js");
        const idx = path.join(dir, "sub", "index.js");
        fs.writeFileSync(a, 'require("./sub");\n');
        fs.writeFileSync(idx, "module.exports = {};\n");
        const graph = buildImportGraph([a, idx]);
        assert.strictEqual(graph.inDegree[idx], 1);
    });

    check("jsdoc-scribe's own lib/+bin/ have no orphans among their real entry points", () => {
        const { collectFiles } = require("../lib/index.js");
        const root = path.resolve(__dirname, "..");
        const files = [...collectFiles(path.join(root, "lib")), ...collectFiles(path.join(root, "bin"))];
        const graph = buildImportGraph(files);
        const entryPoints = [
            path.join(root, "bin", "cli.js"),
            path.join(root, "bin", "gen-docs.js"),
            path.join(root, "lib", "index.js"),
            path.join(root, "lib", "docs.js"),
            path.join(root, "lib", "lint.js"),
        ].filter((p) => fs.existsSync(p));
        const orphans = findOrphanFiles(graph, entryPoints);
        orphans.forEach((o) => {
            entryPoints.forEach((e) => {
                assert.notStrictEqual(o, e, "a real entry point must never be reported as an orphan");
            });
        });
    });
};
