"use strict";

/**
 * Renderer unit tests — tests lib/renderer.js buildSite() in isolation.
 * Uses lightweight mock module objects (no file I/O or TS compilation needed)
 * to exercise HTML output, search index, TOC, badges, highlighting, and links.
 */

const assert  = require("assert");
const { buildSite, pathTree, ancestorChain, cardBreadcrumb, CSS_STRUCTURE } = require("../lib/renderer.js");

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

    check("renderer: module page has two-column card layout and right TOC (Phase G)", () => {
        const modules = [makeMod("/proj/src/svc.ts", {
            functions: [makeFunc("start"), makeFunc("stop")],
        })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage, "no module page");
        // Two-column card layout still present
        assert.ok(modPage.html.includes("card-code"),   "card-code panel missing");
        assert.ok(modPage.html.includes("card-prose"),  "card-prose panel missing");
        assert.ok(modPage.html.includes("code-label"),  "code-label missing in code panel");
        assert.ok(modPage.html.includes("fn-start"),    "anchor id fn-start missing");
        // Phase G: TOC is now present
        assert.ok(modPage.html.includes("layout-toc"),  "layout-toc class should be present (Phase G)");
        assert.ok(modPage.html.includes("toc-title"),   "toc-title should be present (Phase G)");
        assert.ok(modPage.html.includes("On this page"),"TOC heading should be present (Phase G)");
        assert.ok(modPage.html.includes('data-anchor='),"toc data-anchor attributes missing");
    });

    check("renderer: topnav present on index and module pages (Phase G)", () => {
        const modules = [makeMod("/proj/src/api.ts", {
            functions: [makeFunc("getUser")],
        })];
        const pages = buildSite(modules, { projectName: "MyDocs", version: "1.14.0" });
        const indexPage = pages.find(p => p.path === "index.html");
        const modPage   = pages.find(p => p.path.startsWith("modules/"));
        assert.ok(indexPage, "index.html missing");
        assert.ok(modPage,   "module page missing");
        assert.ok(indexPage.html.includes('class="topnav"'), "topnav missing from index page");
        assert.ok(modPage.html.includes('class="topnav"'),   "topnav missing from module page");
        assert.ok(indexPage.html.includes("search-box"),  "search-box missing from index topnav");
        assert.ok(modPage.html.includes("topnav-logo"),   "topnav-logo missing from module page");
        assert.ok(modPage.html.includes("search-kbd"),    "search-kbd hint missing");
    });

    check("renderer: sidebar has section-title, no sidebar-header (Phase G)", () => {
        const modules = [makeMod("/proj/src/api.ts")];
        const pages = buildSite(modules, { projectName: "Test" });
        const modPage = pages.find(p => p.path.startsWith("modules/"));
        assert.ok(modPage, "no module page");
        // New white sidebar has section-title
        assert.ok(modPage.html.includes("sidebar-section-title"), "sidebar-section-title missing");
        // Old dark sidebar-header is gone
        assert.ok(!modPage.html.includes("sidebar-header"), "sidebar-header should be absent (Phase G)");
    });

    check("renderer: CSS_STRUCTURE contains Phase G variables and selectors", () => {
        const { CSS_STRUCTURE } = require("../lib/renderer.js");
        assert.ok(CSS_STRUCTURE.includes("--topnav-h"),        "--topnav-h missing from CSS");
        assert.ok(CSS_STRUCTURE.includes("--accent"),          "--accent missing from CSS");
        assert.ok(CSS_STRUCTURE.includes("--sidebar-bg"),      "--sidebar-bg missing from CSS");
        assert.ok(CSS_STRUCTURE.includes(".topnav"),           ".topnav selector missing");
        assert.ok(CSS_STRUCTURE.includes(".toc-title"),        ".toc-title selector missing");
        assert.ok(CSS_STRUCTURE.includes("layout-toc"),        "layout-toc class missing");
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

    check("renderer: sidebar smart grouping strips deep common prefix", () => {
        const deepMods = [
            makeMod("/proj/applications/admin/modules/environment/routeConstants.ts"),
            makeMod("/proj/applications/admin/modules/environment/config.ts", {
                functions: [makeFunc("getEnv")],
            }),
            makeMod("/proj/applications/admin/modules/auth/login.ts", {
                functions: [makeFunc("login")],
            }),
        ];
        const pages = buildSite(deepMods, { projectName: "Test" });
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(idx, "index.html missing");
        // Group labels must be short (last segment only)
        assert.ok(idx.html.includes(">environment<") || idx.html.includes(">environment</"),
            "group label should be 'environment' not full path");
        assert.ok(idx.html.includes(">auth<") || idx.html.includes(">auth</"),
            "group label should be 'auth' not full path");
        // Must NOT contain the long nested path as visible text
        assert.ok(!idx.html.includes("ADMIN/MODULES"), "long path leaked into sidebar");
        assert.ok(!idx.html.includes("applications/admin/modules/environment</"),
            "full path should not appear as group label");
    });

    check("renderer: empty module shows placeholder on index card and module page", () => {
        const mods = [
            makeMod("/proj/src/empty.ts"),
            makeMod("/proj/src/utils.ts", { functions: [makeFunc("doIt")] }),
        ];
        const pages = buildSite(mods, { projectName: "Test" });
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(idx.html.includes("No exported"), "index card should note empty module");
        // Module page with exports should still have card content
        const utilPage = pages.find(p => p.path && p.path.includes("utils"));
        assert.ok(utilPage && utilPage.html.includes("card-prose"), "utils card-prose missing");
    });

    // -----------------------------------------------------------------------
    // task-pi-05 — pathTree(modules) + ancestorChain(root, mod) data layer
    // Mandatory edge-case gate per adr-phase-i-tree-nav.md (6 cases).
    // -----------------------------------------------------------------------

    check("pathTree: EC1 single module at root -> one file child, zero dir children", () => {
        const mods = [makeMod("/proj/src/utils.ts")];
        const tree = pathTree(mods);
        assert.strictEqual(tree.children.length, 1);
        assert.strictEqual(tree.children[0].type, "file");
        assert.strictEqual(tree.children.filter(c => c.type === "dir").length, 0);
    });

    check("pathTree: EC2 zero-depth project (flat) -> root has only file children", () => {
        const mods = [makeMod("/proj/src/a.ts"), makeMod("/proj/src/b.ts"), makeMod("/proj/src/c.ts")];
        const tree = pathTree(mods);
        assert.ok(tree.children.every(c => c.type === "file"));
    });

    check("pathTree: EC3 one deep outlier among mostly-flat modules", () => {
        const mods = [
            makeMod("/proj/src/a.ts"), makeMod("/proj/src/b.ts"), makeMod("/proj/src/c.ts"), makeMod("/proj/src/d.ts"),
            makeMod("/proj/src/l1/l2/l3/l4/l5/deep.ts"),
        ];
        const tree = pathTree(mods);
        const chain = ancestorChain(tree, mods[4]);
        assert.strictEqual(chain.length, 5, "expected 5 dir nodes in ancestor chain");
        assert.strictEqual(tree.children.filter(c => c.type === "file").length, 4);
    });

    check("pathTree/ancestorChain: EC4 4-level fixture a/b/c/d/mod.ts -> chain [a,b,c,d]", () => {
        // needs a sibling module — with only 1 module, commonRoot() strips the whole dir
        // path as the "common root", degenerating to a flat file (expected, pre-existing behavior).
        const mods = [makeMod("/proj/a/b/c/d/mod.ts"), makeMod("/proj/other.ts")];
        const tree = pathTree(mods);
        const chain = ancestorChain(tree, mods[0]);
        assert.strictEqual(chain.length, 4);
        assert.deepStrictEqual(chain.map(n => n.name), ["a", "b", "c", "d"]);
    });

    check("pathTree: EC5 sort stability — dirs before files, alphabetical case-insensitive", () => {
        const mods = [
            makeMod("/proj/src/banana.ts"), makeMod("/proj/src/apple.ts"),
            makeMod("/proj/src/Zebra/inner.ts"),
        ];
        const tree = pathTree(mods);
        const names = tree.children.map(c => c.name);
        assert.strictEqual(names[0], "Zebra", "dir should sort before files");
        assert.strictEqual(names[1], "apple");
        assert.strictEqual(names[2], "banana");
    });

    check("pathTree: EC6 shared deep prefix composes correctly with deeperCommonRoot", () => {
        const mods = [
            makeMod("/proj/a/b/c/mod1.ts"), makeMod("/proj/a/b/c/mod2.ts"), makeMod("/proj/a/b/d/mod3.ts"),
        ];
        const tree = pathTree(mods);
        const dirNames = tree.children.filter(c => c.type === "dir").map(c => c.name).sort();
        assert.deepStrictEqual(dirNames, ["c", "d"], "deepRoot should strip shared a/b, leaving two top dirs");
    });

    check("pathTree: empty module list -> root with zero children", () => {
        assert.strictEqual(pathTree([]).children.length, 0);
    });

    check("pathTree/ancestorChain: 10-level-deep path -> 10-node ancestor chain, no truncation/crash", () => {
        const deepPath = "/proj/" + Array.from({ length: 10 }, (_, i) => "l" + (i + 1)).join("/") + "/deep.ts";
        const mods = [makeMod(deepPath), makeMod("/proj/other.ts")];
        const tree = pathTree(mods);
        const chain = ancestorChain(tree, mods[0]);
        assert.strictEqual(chain.length, 10, "expected 10 ancestor dir nodes for a 10-level-deep module");
        assert.deepStrictEqual(chain.map(n => n.name), Array.from({ length: 10 }, (_, i) => "l" + (i + 1)));
    });

    check("pathTree: unicode-style filenames and directory names sort and nest correctly", () => {
        const mods = [
            makeMod("/proj/src/cafe-unicode/nihongo-unicode.ts"),
            makeMod("/proj/src/cafe-unicode/uber-unicode.ts"),
            makeMod("/proj/src/zurich-unicode.ts"),
        ];
        const tree = pathTree(mods);
        const dir = tree.children.find(c => c.type === "dir" && c.name === "cafe-unicode");
        assert.ok(dir, "unicode-style directory name should be preserved as a dir node");
        assert.strictEqual(dir.children.length, 2);
        // moduleLabel() strips the .ts/.js extension by design (lib/renderer.js:870) — file
        // node names in the tree are extension-less, matching existing, pre-sprint-9 behavior.
        const fileNames = dir.children.map(c => c.name).sort();
        assert.deepStrictEqual(fileNames, ["nihongo-unicode", "uber-unicode"].sort(), "filenames preserved, no corruption");
        assert.ok(tree.children.some(c => c.type === "file" && c.name === "zurich-unicode"), "top-level filename preserved");
    });

    check("pathTree: true unicode (non-ASCII) filenames and dir names round-trip without corruption", () => {
        const unicodeDir  = "café";
        const unicodeFile = "日本";
        const mods = [
            makeMod("/proj/src/" + unicodeDir + "/" + unicodeFile + ".ts"),
            makeMod("/proj/src/other.ts"),
        ];
        const tree = pathTree(mods);
        const dir = tree.children.find(c => c.type === "dir" && c.name === unicodeDir);
        assert.ok(dir, "non-ASCII directory name must be preserved exactly");
        assert.strictEqual(dir.children[0].name, unicodeFile, "non-ASCII filename must be preserved exactly");
    });

    // -----------------------------------------------------------------------
    // task-pi-05b — buildSidebar recursive N-level tree + ARIA + keyboard nav
    // -----------------------------------------------------------------------

    check("buildSidebar: AC1/AC2 4-level fixture renders 4 nested <details>", () => {
        const mods = [makeMod("/proj/a/b/c/d/mod.ts", { functions: [makeFunc("fn1")] }), makeMod("/proj/other.ts")];
        const modPage = buildSite(mods, { projectName: "Test" })
            .find(p => p.path.startsWith("modules/") && p.path.includes("mod") && !p.path.includes("other"));
        const detailsCount = (modPage.html.match(/<details class="sidebar-item-details"/g) || []).length;
        assert.strictEqual(detailsCount, 4);
    });

    check("buildSidebar: AC3 every ancestor of the active module auto-expands", () => {
        const mods = [makeMod("/proj/a/b/c/d/mod.ts", { functions: [makeFunc("fn1")] }), makeMod("/proj/other.ts")];
        const modPage = buildSite(mods, { projectName: "Test" })
            .find(p => p.path.startsWith("modules/") && p.path.includes("mod") && !p.path.includes("other"));
        const openCount = (modPage.html.match(/<details class="sidebar-item-details"[^>]*\sopen[^>]*>/g) || []).length;
        assert.strictEqual(openCount, 4, "all 4 ancestor dirs should carry the open attribute");
    });

    check("buildSidebar: ARIA tree semantics present (role/level/expanded/setsize/posinset)", () => {
        const mods = [makeMod("/proj/a/b/mod.ts", { functions: [makeFunc("fn1")] }), makeMod("/proj/other.ts")];
        const modPage = buildSite(mods, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes('role="tree"'));
        assert.ok(modPage.html.includes('role="treeitem"'));
        assert.ok(modPage.html.includes('aria-level='));
        assert.ok(modPage.html.includes('aria-expanded='));
        assert.ok(modPage.html.includes('aria-setsize='));
        assert.ok(modPage.html.includes('aria-posinset='));
    });

    check("buildSidebar: AC5 flat/shallow project renders no <details> wrapper (no-regression)", () => {
        const mods = [makeMod("/proj/lib/renderer.js"), makeMod("/proj/lib/index.js"), makeMod("/proj/lib/extractor.js")];
        const modPage = buildSite(mods, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(!modPage.html.includes('<details class="sidebar-item-details"'), "flat project must not wrap in <details>");
        assert.ok(modPage.html.includes('class="sidebar-link'), "flat links should still render");
    });

    check("buildSidebar: --depth CSS custom property applied inline at the right levels", () => {
        const mods = [makeMod("/proj/a/b/mod.ts", { functions: [makeFunc("fn1")] }), makeMod("/proj/other.ts")];
        const modPage = buildSite(mods, { projectName: "Test" })
            .find(p => p.path.startsWith("modules/") && p.path.includes("mod") && !p.path.includes("other"));
        assert.ok(modPage.html.includes('style="--depth:0"'));
        assert.ok(modPage.html.includes('style="--depth:1"'));
    });

    check("CSS_STRUCTURE: indentation formula, sticky depth cap, focus-visible ring, legacy alias kept", () => {
        assert.ok(CSS_STRUCTURE.includes("calc(16px + (var(--depth,0) * 14px))"), "indentation formula missing");
        assert.ok(CSS_STRUCTURE.includes("min(var(--depth,0),3)"), "sticky depth cap missing");
        assert.ok(CSS_STRUCTURE.includes(":focus-visible"), "focus-visible ring missing");
        assert.ok(CSS_STRUCTURE.includes(".sidebar-link-indent{padding-left:28px}"), "legacy alias must remain in CSS");
    });

    // -----------------------------------------------------------------------
    // task-pi-05c — cardBreadcrumb(sl) + buildIndexBody breadcrumb markup
    // -----------------------------------------------------------------------

    check("cardBreadcrumb: 1 level -> null (no breadcrumb)", () => {
        assert.strictEqual(cardBreadcrumb("utils"), null);
    });

    check("cardBreadcrumb: 2 levels -> [helpers]", () => {
        assert.deepStrictEqual(cardBreadcrumb("helpers/express"), ["helpers"]);
    });

    check("cardBreadcrumb: 3 levels -> [helpers,server]", () => {
        assert.deepStrictEqual(cardBreadcrumb("helpers/server/express"), ["helpers", "server"]);
    });

    check("cardBreadcrumb: 4+ levels -> ellipsis + last 2 segments", () => {
        assert.deepStrictEqual(cardBreadcrumb("helpers/server/auth/express"), ["…", "server", "auth"]);
    });

    check("buildIndexBody: AC2 top-level files render with no breadcrumb markup", () => {
        const mods = [makeMod("/proj/src/utils.ts", { functions: [makeFunc("doIt")] })];
        const idx = buildSite(mods, { projectName: "Test" }).find(p => p.path === "index.html");
        assert.ok(!idx.html.includes("module-card-path"));
    });

    check("buildIndexBody: AC1 nested module shows breadcrumb, filename-only name, and title attr", () => {
        const mods = [makeMod("/proj/helpers/server/express.ts", { functions: [makeFunc("run")] }), makeMod("/proj/other.ts")];
        const idx = buildSite(mods, { projectName: "Test" }).find(p => p.path === "index.html");
        assert.ok(idx.html.includes("module-card-path"));
        assert.ok(idx.html.includes(">helpers<"));
        assert.ok(idx.html.includes(">express<"), "card name should be filename only");
        assert.ok(!idx.html.includes(">helpers/server/express<"), "card name must not be the full sl");
        assert.ok(idx.html.includes('title="helpers/server/express"'), "title attr should carry the full sl");
    });

    check("buildIndexBody: AC4 breadcrumb segments match sidebar folder names (shared fixture)", () => {
        const mods = [
            makeMod("/proj/helpers/server/express.ts", { functions: [makeFunc("run")] }),
            makeMod("/proj/other.ts"),
        ];
        const pages = buildSite(mods, { projectName: "Test" });
        const idx = pages.find(p => p.path === "index.html");
        const modPage = pages.find(p => p.path.includes("express"));
        assert.ok(modPage.html.includes(">helpers<"));
        assert.ok(modPage.html.includes(">server<"));
        assert.ok(idx.html.includes(">helpers<"));
        assert.ok(idx.html.includes(">server<"));
    });

    check("buildIndexBody: 4+ level path truncates to ellipsis + last 2 segments on index card", () => {
        const mods = [
            makeMod("/proj/helpers/server/auth/express.ts", { functions: [makeFunc("run")] }),
            makeMod("/proj/other.ts"),
        ];
        const idx = buildSite(mods, { projectName: "Test" }).find(p => p.path === "index.html");
        assert.ok(idx.html.includes("…"), "ellipsis should appear for a 4+ level path");
        assert.ok(idx.html.includes(">server<"));
        assert.ok(idx.html.includes(">auth<"));
    });

    check("CSS: .module-card-path uses --text2 (not --text3) per the AA contrast fix", () => {
        assert.ok(CSS_STRUCTURE.includes(".module-card-path{font-size:11px;font-weight:500;color:var(--text2)"));
    });

};
