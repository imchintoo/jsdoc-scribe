"use strict";

/**
 * Renderer unit tests — tests lib/renderer.js buildSite() in isolation.
 * Uses lightweight mock module objects (no file I/O or TS compilation needed)
 * to exercise HTML output, search index, TOC, badges, highlighting, and links.
 */

const assert  = require("assert");
const { buildSite } = require("../lib/renderer.js");

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeMod(filePath, overrides) {
    return Object.assign({
        filePath,
        description: null,
        since: null,
        functions:   [],
        classes:     [],
        interfaces:  [],
        typeAliases: [],
        enums:       [],
        variables:   [],
    }, overrides);
}

function makeFunc(name, overrides) {
    return Object.assign({
        name,
        params:      [],
        returnType:  "void",
        isAsync:     false,
        isExported:  true,
        isGenerator: false,
        deprecated:  null,
        since:       null,
        description: null,
        example:     null,
        jsdocParams: [],
        returns:     null,
        throws:      [],
        line:        1,
    }, overrides);
}

function makeClass(name, overrides) {
    return Object.assign({
        name,
        isExported:  true,
        isAbstract:  false,
        extends:     [],
        implements:  [],
        deprecated:  null,
        since:       null,
        description: null,
        example:     null,
        line:        1,
        constructor: null,
        properties:  [],
        methods:     [],
        getters:     [],
        setters:     [],
    }, overrides);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

module.exports = function runRendererTests(check) {

    check("renderer: buildSite returns 3 assets + index.html + one page per module", () => {
        const modules = [makeMod("/proj/src/api.ts")];
        const pages   = buildSite(modules, { projectName: "Test" });
        const paths   = pages.map(p => p.path);
        assert.ok(paths.includes("assets/style.css"),  "missing assets/style.css");
        assert.ok(paths.includes("assets/app.js"),     "missing assets/app.js");
        assert.ok(paths.includes("search-index.js"),   "missing search-index.js");
        assert.ok(paths.includes("index.html"),        "missing index.html");
        assert.ok(paths.some(p => p.startsWith("modules/")), "missing module page");
        assert.strictEqual(pages.length, 5, "expected 5 pages total");
    });

    check("renderer: search index contains every function and class symbol", () => {
        const modules = [makeMod("/proj/src/svc.ts", {
            functions: [makeFunc("start"), makeFunc("stop")],
            classes:   [makeClass("Server")],
        })];
        const pages   = buildSite(modules, { projectName: "Test" });
        const idxPage = pages.find(p => p.path === "search-index.js");
        assert.ok(idxPage, "no search-index.js page");
        const idx = JSON.parse(idxPage.html.replace("window.__SEARCH_INDEX__=", "").replace(/;$/, ""));
        assert.ok(idx.some(e => e.name === "start"),  "start not in search index");
        assert.ok(idx.some(e => e.name === "stop"),   "stop not in search index");
        assert.ok(idx.some(e => e.name === "Server"), "Server not in search index");
        assert.ok(idx.every(e => e.url && e.url.startsWith("modules/")), "URL prefix wrong");
    });

    check("renderer: module page uses two-column card layout, no TOC", () => {
        const modules = [makeMod("/proj/src/svc.ts", {
            functions: [makeFunc("start"), makeFunc("stop")],
        })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage, "no module page");
        assert.ok(modPage.html.includes("card-code"),   "card-code panel missing");
        assert.ok(modPage.html.includes("card-prose"),  "card-prose panel missing");
        assert.ok(modPage.html.includes("code-label"),  "code-label missing in code panel");
        assert.ok(modPage.html.includes("fn-start"),    "anchor id fn-start missing");
        assert.ok(!modPage.html.includes("has-toc"),    "has-toc should be absent");
        assert.ok(!modPage.html.includes("On this page"), "TOC title should be absent");
    });

    check("renderer: deprecated badge and notice rendered for deprecated items", () => {
        const modules = [makeMod("/proj/src/old.ts", {
            functions: [makeFunc("legacyFn", { deprecated: "Use newFn instead." })],
        })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("badge-deprecated"),  "badge-deprecated missing");
        assert.ok(modPage.html.includes("deprecated-notice"), "deprecated-notice missing");
        assert.ok(modPage.html.includes("newFn"), "deprecation message not rendered");
    });

    check("renderer: source link contains GitHub URL and line anchor when sourceUrl set", () => {
        const modules = [makeMod("/proj/src/svc.ts", {
            functions: [makeFunc("fetch", { line: 42 })],
        })];
        const modPage = buildSite(modules, {
            projectName: "Test",
            sourceUrl:   "https://github.com/org/repo/blob/main",
        }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("github.com/org/repo"), "GitHub URL not in source link");
        assert.ok(modPage.html.includes("#L42"),                "line anchor #L42 not in source link");
    });

    check("renderer: @example blocks rendered with syntax-highlighting tok-* spans", () => {
        const modules = [makeMod("/proj/src/util.ts", {
            functions: [makeFunc("doIt", {
                example: "const result = doIt();\nreturn result;",
            })],
        })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("tok-kw"), "no tok-kw span in @example block");
        // "const" and "return" are keywords — both should be highlighted
        assert.ok(
            modPage.html.includes(">const<") || modPage.html.includes(">return<"),
            "keyword text not inside span"
        );
    });

    check("renderer: sidebar symbol tree rendered with kind pills for active module", () => {
        const modules = [makeMod("/proj/src/api.ts", {
            functions: [makeFunc("getUser"), makeFunc("setUser")],
            classes:   [makeClass("UserService")],
        })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("sym-rows"),   "sym-rows missing from sidebar");
        assert.ok(modPage.html.includes("sym-fn"),     "sym-fn pill missing");
        assert.ok(modPage.html.includes("sym-cls"),    "sym-cls pill missing");
        assert.ok(modPage.html.includes("getUser"),    "getUser not in symbol tree");
        assert.ok(modPage.html.includes("UserService"),"UserService not in symbol tree");
    });

    check("renderer: {@link Symbol} in description resolves to <a class=link-ref>", () => {
        const modules = [
            makeMod("/proj/src/errors.ts", {
                classes: [makeClass("AppError")],
            }),
            makeMod("/proj/src/utils.ts", {
                functions: [makeFunc("wrap", {
                    description: "Wraps any thrown value in an {@link AppError}.",
                })],
            }),
        ];
        const pages    = buildSite(modules, { projectName: "Test" });
        const utilPage = pages.find(p => p.path && p.path.includes("utils"));
        assert.ok(utilPage, "utils module page not found");
        assert.ok(utilPage.html.includes("link-ref"), "{@link} not resolved — link-ref class missing");
        assert.ok(utilPage.html.includes("AppError"), "AppError not present in resolved link");
        assert.ok(utilPage.html.includes("href="),    "resolved link has no href");
    });

};
