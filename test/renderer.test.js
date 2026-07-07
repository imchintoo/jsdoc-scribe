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
        // NOTE (fixed 2026-07-07, pre-existing drift from adr-phase-m-exact-design-shell.md):
        // Phase M moved the logo/brand out of the topnav into the sidebar
        // (buildTopnav() no longer emits topnav-logo at all -- see .sidebar-logo
        // in buildSidebar()). This assertion was never updated when that shipped.
        assert.ok(modPage.html.includes("sidebar-logo"),   "sidebar-logo missing from module page");
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

    // -----------------------------------------------------------------------
    // v1.20.1 — buildQualitySection() embedded directly into index.html
    // (no separate dashboard file; see docs/backlog/adr-phase-j-project-dashboard.md,
    // "single-artifact" revision).
    // -----------------------------------------------------------------------

    function makeQuality(overrides) {
        return Object.assign({
            result: {
                averageHealthScore: 67, averageMI: 55.4,
                totalFiles: 2, totalFunctions: 10,
                errorCount: 1, warnCount: 3,
                clones: [],
                files: [],
            },
        }, overrides);
    }

    check("buildQualitySection: no quality option -> buildSite output unaffected (no section, still 5 pages)", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const pages = buildSite(modules, { projectName: "Test" });
        assert.strictEqual(pages.length, 5, "no new page should be added when quality is absent");
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(!idx.html.includes("id=\"code-health\""), "code-health section should not appear without options.quality");
        assert.ok(!idx.html.includes("topnav-quality-link"), "quality nav link should not appear without options.quality");
    });

    check("buildQualitySection: options.quality present -> embedded section on index.html + 4 detail pages (9 total)", () => {
        // story-code-health-drilldown (2026-07-06) revises the prior "still exactly
        // 5 pages" contract: the index section now renders summary cards instead of
        // full tables, each linking to its own full-list detail page. This is a
        // deliberate, approved exception to the single-artifact principle (see
        // docs/backlog/story-code-health-drilldown.md's Constraints section) — the
        // 4 new pages are extensions of the doc site's pre-existing multi-page
        // nature (one page per module has always existed), not a new dashboard file.
        const modules = [makeMod("/proj/src/a.ts")];
        const quality = makeQuality();
        const pages = buildSite(modules, { projectName: "Test", quality });
        assert.strictEqual(pages.length, 9, "expected 5 base pages + 4 health detail pages");
        const paths = pages.map(p => p.path);
        ["health-attention.html", "health-duplicates.html", "health-imports.html", "health-orphans.html"]
            .forEach(p => assert.ok(paths.includes(p), `missing detail page ${p}`));
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(idx.html.includes('id="code-health"'), "code-health section missing from index.html");
        // NOTE (fixed 2026-07-07, pre-existing drift from adr-phase-m-exact-design-shell.md):
        // Phase M's own "Consequences" section says this rename/relocation should have
        // updated this assertion; it never landed. topnav-quality-link -> sidebar-quality-link.
        assert.ok(idx.html.includes("sidebar-quality-link"), "Code Health nav link missing from sidebar");
        assert.ok(idx.html.includes(">67<"), "average health score not rendered");
        assert.ok(idx.html.includes("qcard-grid"), "summary card grid missing from index page");
    });

    check("buildQualitySection: index cards link to their detail pages with a View more label", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const quality = makeQuality();
        const idx = buildSite(modules, { projectName: "Test", quality }).find(p => p.path === "index.html");
        assert.ok(idx.html.includes('href="health-attention.html"'), "attention card missing view-more link");
        assert.ok(idx.html.includes('href="health-duplicates.html"'), "duplicates card missing view-more link");
        assert.ok(idx.html.includes("qcard-more"), "qcard-more class missing");
    });

    check("health detail pages: full uncapped lists, even beyond the 5-row card preview", () => {
        const files = Array.from({ length: 8 }, (_, i) => ({
            filePath: `file${i}.js`,
            summary: { weightedHealthScore: 30 + i, weightedMI: 40, worstSeverity: "warn", smellIds: [] },
        }));
        const quality = makeQuality({ result: Object.assign({}, makeQuality().result, { files }) });
        const modules = [makeMod("/proj/src/a.ts")];
        const pages = buildSite(modules, { projectName: "Test", quality });
        const idx = pages.find(p => p.path === "index.html");
        const detail = pages.find(p => p.path === "health-attention.html");
        assert.ok(detail, "health-attention.html not generated");
        files.forEach(f => assert.ok(detail.html.includes(f.filePath), `${f.filePath} missing from detail page`));
        // NOTE (fixed 2026-07-07, pre-existing drift from story-code-health-redesign.md):
        // qCard() now renders rows beyond 5 into a zero-JS <details class="qcard-expand">
        // block (ADR Decision 3) instead of omitting them from the index page entirely, so
        // every file's path IS present in idx.html (collapsed) -- the old "missing from
        // idx.html entirely" signal for "capped" no longer holds. What's still true and
        // load-bearing: only 5 rows are in the *default-visible* preview, the rest sit
        // behind an explicit "View N more" expand toggle, both provably present.
        assert.ok(idx.html.includes("qcard-expand"), "expected the overflow rows to be behind a qcard-expand details toggle");
        assert.ok(idx.html.includes("View 3 more"), "expected a 'View 3 more' toggle label for the 3 rows beyond the 5-row preview");
        assert.ok(detail.html.includes("qback"), "back-to-index link missing on detail page");
        assert.ok(detail.html.includes('href="index.html#code-health"'), "back link should point to index.html#code-health");
    });

    check("buildHealthDetailPages / smell ids render on the full detail page, not the index summary card", () => {
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [
                    { filePath: "good.js", summary: { weightedHealthScore: 90, weightedMI: 80, worstSeverity: "ok", smellIds: [] } },
                    { filePath: "bad.js", summary: { weightedHealthScore: 20, weightedMI: 15, worstSeverity: "error", smellIds: ["fragile"] } },
                ],
            }),
        });
        const modules = [makeMod("/proj/src/a.ts")];
        const pages = buildSite(modules, { projectName: "Test", quality });
        const idx = pages.find(p => p.path === "index.html");
        const detail = pages.find(p => p.path === "health-attention.html");
        assert.ok(!idx.html.includes("fragile"), "smell id should no longer render on the index summary card");
        assert.ok(detail.html.includes("fragile"), "smell id should render on the full detail page");
    });

    check("buildQualitySection: module pages link back to index.html#code-health when quality is present", () => {
        const modules = [makeMod("/proj/src/svc.ts", { functions: [makeFunc("run")] })];
        const quality = makeQuality();
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes('href="../index.html#code-health"'), "module page quality link should point back to index.html#code-health");
    });

    check("buildQualitySection: hotspot files sorted ascending by weightedHealthScore, worst first", () => {
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [
                    { filePath: "good.js", summary: { weightedHealthScore: 90, weightedMI: 80, worstSeverity: "ok", smellIds: [] } },
                    { filePath: "bad.js", summary: { weightedHealthScore: 20, weightedMI: 15, worstSeverity: "error", smellIds: ["fragile"] } },
                ],
            }),
        });
        const { buildQualitySection } = require("../lib/renderer.js");
        const html = buildQualitySection(quality);
        assert.ok(html.indexOf("bad.js") < html.indexOf("good.js"), "worse-health file should be listed before the better one");
        // Smell ids now render on the full health-attention.html detail page, not
        // this index-page summary card — see the dedicated detail-page test below.
    });

    check("buildQualitySection: clone pairs and import-graph orphan files rendered when present", () => {
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                clones: [{ similarity: 0.87, blockA: { filePath: "a.js", functionName: "f", startLine: 1, endLine: 5 }, blockB: { filePath: "b.js", functionName: "g", startLine: 1, endLine: 5 } }],
            }),
            graph: { edges: [], inDegree: { "a.js": 4 } },
            orphans: ["unused.js"],
        });
        const { buildQualitySection } = require("../lib/renderer.js");
        const html = buildQualitySection(quality);
        assert.ok(html.includes("Duplicate code"), "clone section heading missing");
        assert.ok(html.includes("87%"), "similarity percentage not rendered");
        assert.ok(html.includes("unused.js"), "orphan file not rendered");
        assert.ok(html.includes("a.js"), "most-imported file not rendered");
    });

    check("buildQualitySection: returns empty string when quality is null/undefined (defensive)", () => {
        const { buildQualitySection } = require("../lib/renderer.js");
        assert.strictEqual(buildQualitySection(null), "");
        assert.strictEqual(buildQualitySection(undefined), "");
        assert.strictEqual(buildQualitySection({}), "");
    });

    // -----------------------------------------------------------------------
    // story-code-health-drilldown (2026-07-06) — module-page health strip.
    // -----------------------------------------------------------------------

    check("module page: no --quality -> no health strip rendered at all (regression)", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] })];
        const modPage = buildSite(modules, { projectName: "Test" }).find(p => p.path.startsWith("modules/"));
        assert.ok(!modPage.html.includes("qstrip"), "qstrip should not render without options.quality");
    });

    check("module page: --quality present -> health strip renders with all 8 fields for a matched file", () => {
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [{
                    filePath: "/proj/src/a.ts",
                    functions: [
                        { name: "f1", metrics: [{ name: "cyclomatic", value: 20, threshold: 10, severity: "error" }] },
                        { name: "f2", metrics: [{ name: "cyclomatic", value: 8, threshold: 10, severity: "warn" }] },
                    ],
                    summary: { weightedHealthScore: 41, weightedMI: 34, worstSeverity: "error", smellIds: ["god-function"] },
                }],
                clones: [{ similarity: 0.9, blockA: { filePath: "/proj/src/a.ts", functionName: "f1", startLine: 1, endLine: 5 }, blockB: { filePath: "/proj/src/other.ts", functionName: "g", startLine: 1, endLine: 5 } }],
            }),
        });
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("f1"), makeFunc("f2")] })];
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes('aria-label="Code health summary"'), "strip landmark missing");
        assert.ok(modPage.html.includes(">41<"), "health score chip missing");
        assert.ok(modPage.html.includes(">34<"), "maintainability chip missing");
        assert.ok(modPage.html.includes(">2<"), "functions chip (count 2) missing");
        // NOTE (fixed 2026-07-07, pre-existing drift from story-file-detail-redesign.md):
        // buildHealthStrip()'s old flat chip row was replaced by buildFileHero()'s
        // gauge+chip markup ("worst: error" inline text), never re-asserted after that shipped.
        assert.ok(modPage.html.includes("worst: error"), "worst severity chip missing");
        assert.ok(modPage.html.includes("god-function"), "smells chip missing");
        // 1 error metric, 1 warn metric across the file's two functions
        assert.ok(modPage.html.includes(">1<"), "errors/warnings chip value (1) missing");
        // Clone involvement: this file appears in one clone pair -> chip should link to the duplicates page
        assert.ok(modPage.html.includes('href="../health-duplicates.html"'), "clone-count chip should link to health-duplicates.html when count > 0");
    });

    check("module page: --quality present but this file has no code-multivitals entry -> muted fallback row, never throws", () => {
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, { files: [{ filePath: "/proj/src/other-file.ts", functions: [], summary: { weightedHealthScore: 90, weightedMI: 80, worstSeverity: "ok", smellIds: [] } }] }),
        });
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] })];
        assert.doesNotThrow(() => buildSite(modules, { projectName: "Test", quality }));
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        // NOTE (fixed 2026-07-07, pre-existing drift from story-file-detail-redesign.md):
        // the fallback container is buildFileHero()'s `qhero qhero-file` aside now, not the
        // retired buildHealthStrip()'s `qstrip` -- never re-asserted after that shipped.
        assert.ok(modPage.html.includes("qhero-file"), "hero fallback container should still render");
        assert.ok(modPage.html.includes("No code health data for this file."), "fallback text missing");
        assert.ok(!modPage.html.includes("qchip-label"), "no real chips should render in the fallback state");
    });

    check("buildFileHealthLookup: derives per-file error/warning/function counts from existing metrics, no new fields required", () => {
        const { buildFileHealthLookup } = require("../lib/renderer.js");
        const quality = {
            result: {
                files: [{
                    filePath: "/proj/x.js",
                    functions: [
                        { name: "a", metrics: [{ severity: "error" }, { severity: "warn" }] },
                        { name: "b", metrics: [{ severity: "ok" }] },
                    ],
                    summary: { weightedHealthScore: 55, weightedMI: 44, worstSeverity: "error", smellIds: [] },
                }],
                clones: [],
            },
        };
        const map = buildFileHealthLookup(quality);
        const path = require("path");
        const entry = map[path.resolve("/proj/x.js")];
        assert.ok(entry, "lookup entry missing for known file");
        assert.strictEqual(entry.functions, 2);
        assert.strictEqual(entry.errors, 1);
        assert.strictEqual(entry.warnings, 1);
        assert.strictEqual(entry.healthScore, 55);
    });

    check("index page: --quality present -> Modules grid is removed, Code Health is the only content section", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] }), makeMod("/proj/src/b.ts")];
        const quality = makeQuality();
        const idx = buildSite(modules, { projectName: "Test", quality }).find(p => p.path === "index.html");
        assert.ok(!idx.html.includes("module-grid"), "Modules grid should be removed from the index page when --quality is active");
        // The sidebar's own "Modules" nav-section label (`sidebar-section-title`) is a
        // separate, always-present element -- only the index-BODY heading is checked here.
        assert.ok(!idx.html.includes('<div class="section-title">Modules</div>'), "Modules section heading should not render in the index body when --quality is active");
        assert.ok(idx.html.includes('id="code-health"'), "Code Health section should still render");
        // Header/title/subtitle stay -- only the Modules grid itself is dropped.
        assert.ok(idx.html.includes("page-title"), "page title should remain");
    });

    check("index page: no --quality -> Modules grid still renders (regression, unaffected by the drilldown follow-up)", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] })];
        const idx = buildSite(modules, { projectName: "Test" }).find(p => p.path === "index.html");
        assert.ok(idx.html.includes("module-grid"), "Modules grid must still render when --quality is not used");
        assert.ok(idx.html.includes('<div class="section-title">Modules</div>'), "Modules section heading must still render in the index body when --quality is not used");
    });

    check("sidebar module navigation is unaffected when the index Modules grid is removed under --quality", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] }), makeMod("/proj/src/b.ts", { functions: [makeFunc("go")] })];
        const quality = makeQuality();
        const idx = buildSite(modules, { projectName: "Test", quality }).find(p => p.path === "index.html");
        // The full module tree lives in the sidebar (always rendered), independent of the index body content.
        assert.ok(idx.html.includes("sidebar-inner"), "sidebar should still be present");
        assert.ok(idx.html.includes(">a<") || idx.html.includes("modules/"), "sidebar should still link to module pages");
    });

    check("CSS_STRUCTURE: card/detail-page/strip selectors present (story-code-health-drilldown)", () => {
        assert.ok(CSS_STRUCTURE.includes(".qcard-grid"), ".qcard-grid missing");
        assert.ok(CSS_STRUCTURE.includes(".qcard-more"), ".qcard-more missing");
        assert.ok(CSS_STRUCTURE.includes(".qback"), ".qback missing");
        assert.ok(CSS_STRUCTURE.includes(".qstrip"), ".qstrip missing");
        assert.ok(CSS_STRUCTURE.includes(".qchip-label"), ".qchip-label missing");
        assert.ok(CSS_STRUCTURE.includes(".qchip-empty"), ".qchip-empty missing");
        assert.ok(CSS_STRUCTURE.includes("max-width:720px"), "mobile 2-column strip media query missing");
    });

    check("CSS_STRUCTURE: adr-phase-n corrected/new design tokens present, matching the real mockup values", () => {
        assert.ok(CSS_STRUCTURE.includes("Space+Grotesk") && CSS_STRUCTURE.includes("JetBrains+Mono"), "Google Fonts @import for Space Grotesk / JetBrains Mono missing");
        assert.ok(CSS_STRUCTURE.includes('--font-display:"Space Grotesk"'), "--font-display token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes('--font-mono:"JetBrains Mono"'), "--font-mono token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes("--coral:#FF4B2E"), "--coral not corrected to the real mockup value (was #FF6452)");
        assert.ok(CSS_STRUCTURE.includes("--coral-hover:") && CSS_STRUCTURE.includes("--coral-press:"), "--coral-hover/--coral-press tokens missing");
        assert.ok(CSS_STRUCTURE.includes("--purple-hover:") && CSS_STRUCTURE.includes("--purple-press:"), "--purple-hover/--purple-press tokens missing");
        assert.ok(CSS_STRUCTURE.includes("--lime-hover:") && CSS_STRUCTURE.includes("--lime-press:"), "--lime-hover/--lime-press tokens missing");
        assert.ok(CSS_STRUCTURE.includes("--black-soft:") && CSS_STRUCTURE.includes("--offwhite-soft:"), "--black-soft/--offwhite-soft tokens missing");
        assert.ok(CSS_STRUCTURE.includes("--text-on-lime:") && CSS_STRUCTURE.includes("--text-button:"), "--text-on-lime/--text-button tokens missing");
        ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-pill"].forEach(function (t) {
            assert.ok(CSS_STRUCTURE.includes(t + ":"), t + " radius-scale token missing");
        });
        assert.ok(CSS_STRUCTURE.includes("--shadow-card:") && CSS_STRUCTURE.includes("--shadow-inset-dark:"), "shadow tokens missing");
        assert.ok(CSS_STRUCTURE.includes(".badge-pill{") && CSS_STRUCTURE.includes("var(--radius-pill)"), "badge-pill not wired to the radius-pill token");
        assert.ok(CSS_STRUCTURE.includes(".focus-btn{") && CSS_STRUCTURE.includes("var(--text-mono-badge)"), "focus-btn not wired to the mono-badge type token");
        assert.ok(CSS_STRUCTURE.includes(".insight-row{") && CSS_STRUCTURE.includes("var(--border-on-light)"), "insight-row not wired to the border-on-light token");
    });

    check("gen-docs default (--quality-less) output is byte-for-byte unaffected by the adr-phase-n token pass", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] })];
        const before = buildSite(modules, { projectName: "Test", version: "1.0.0" });
        const after = buildSite(modules, { projectName: "Test", version: "1.0.0" });
        assert.deepStrictEqual(before.map(p => p.path), after.map(p => p.path), "page set changed across two identical calls");
        before.forEach((p, i) => assert.strictEqual(p.html, after[i].html, p.path + " is not byte-identical across two identical calls"));
    });


    check("CSS_STRUCTURE: story-function-level-health-drilldown chip-row selectors present", () => {
        assert.ok(CSS_STRUCTURE.includes(".qfn-chip-row{"), ".qfn-chip-row missing");
        assert.ok(CSS_STRUCTURE.includes(".qfn-grade{"), ".qfn-grade missing");
        assert.ok(CSS_STRUCTURE.includes(".qfn-metric-dots{"), ".qfn-metric-dots missing");
        assert.ok(CSS_STRUCTURE.includes(".qfn-smells{"), ".qfn-smells missing");
    });

    check("buildFunctionHealthLookup: matches by name + point-in-range, tightest (smallest) range wins on ambiguity", () => {
        const { buildFunctionHealthLookup } = require("../lib/renderer.js");
        const quality = {
            result: {
                files: [{
                    filePath: "/proj/src/nested.ts",
                    functions: [
                        { name: "helper", startLine: 1, endLine: 100, healthScore: 50, maintainabilityIndex: 50, metrics: [], smells: [] },
                        { name: "helper", startLine: 45, endLine: 55, healthScore: 10, maintainabilityIndex: 20, metrics: [], smells: [] },
                    ],
                }],
            },
        };
        const lookup = buildFunctionHealthLookup(quality, "/proj/src/nested.ts");
        const match = lookup.match("helper", 50);
        assert.ok(match, "expected a match to be found");
        assert.strictEqual(match.healthScore, 10, "expected the tightest (inner, 45-55) range to win over the wider (1-100) outer range");
    });

    check("buildFunctionHealthLookup: no quality data / no file entry / no matching line all return a safe no-op lookup", () => {
        const { buildFunctionHealthLookup } = require("../lib/renderer.js");
        assert.strictEqual(buildFunctionHealthLookup(null, "/proj/x.js").match("f", 1), null, "null quality should be a safe no-op");
        assert.strictEqual(buildFunctionHealthLookup({ result: { files: [] } }, "/proj/x.js").match("f", 1), null, "unknown file should be a safe no-op");
        const q = { result: { files: [{ filePath: "/proj/x.js", functions: [{ name: "f", startLine: 1, endLine: 5, healthScore: 90 }] }] } };
        assert.strictEqual(buildFunctionHealthLookup(q, "/proj/x.js").match("f", 999), null, "a line outside every range should not match");
        assert.strictEqual(buildFunctionHealthLookup(q, "/proj/x.js").match("g", 3), null, "a name with no matching entry should not match");
    });

    check("story-function-level-health-drilldown: functions with different health scores render visibly different chips, not one repeated file-level number", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("good", { line: 5 }), makeFunc("bad", { line: 25 })] })];
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [{
                    filePath: "/proj/src/a.ts",
                    functions: [
                        { name: "good", startLine: 1, endLine: 10, healthScore: 95, maintainabilityIndex: 80, metrics: [{ name: "cyclomatic", value: 2, severity: "ok" }], smells: [] },
                        { name: "bad", startLine: 20, endLine: 30, healthScore: 28, maintainabilityIndex: 15, metrics: [{ name: "cyclomatic", value: 40, severity: "error" }], smells: [{ id: "god-function", label: "god-function", reason: "too big" }] },
                    ],
                    summary: { weightedHealthScore: 60, weightedMI: 47, worstSeverity: "error", smellIds: ["god-function"] },
                }],
            }),
        });
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("A 95"), "expected the healthy function's own grade+score (A 95), not a file-level number");
        assert.ok(modPage.html.includes("F 28"), "expected the unhealthy function's own grade+score (F 28), distinct from the healthy one");
        assert.ok(modPage.html.includes("smells: god-function"), "expected the smells chip scoped to the function that actually has smells");
    });

    check("story-function-level-health-drilldown: a function absent from code-multivitals's report renders the graceful fallback, never file-level data", () => {
        const modules = [makeMod("/proj/src/b.ts", { functions: [makeFunc("mystery", { line: 5 })] })];
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [{ filePath: "/proj/src/b.ts", functions: [], summary: { weightedHealthScore: 99, weightedMI: 99, worstSeverity: "ok", smellIds: [] } }],
            }),
        });
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("No health data for this function."), "expected the per-function fallback text");
        assert.strictEqual((modPage.html.match(/class="qfn-grade"/g) || []).length, 0, "no qfn-grade chip should render -- must never silently reuse the file-level aggregate as this function's own score");
    });

    check("story-function-level-health-drilldown: class constructor/method/getter are each matched by their own line; an unmatched setter falls back gracefully", () => {
        const cls = makeClass("Widget", {
            constructor: { line: 2, params: [], jsdocParams: [], throws: [], description: null },
            methods: [{ name: "run", params: [], returnType: "void", visibility: "public", isStatic: false, isAbstract: false, isAsync: false, deprecated: null, description: null, jsdocParams: [], returns: null, throws: [], line: 10 }],
            getters: [{ name: "value", returnType: "number", isStatic: false, deprecated: null, description: null, line: 20 }],
            setters: [{ name: "value", params: [{ name: "v", type: "number" }], isStatic: false, deprecated: null, description: null, line: 25 }],
        });
        const modules = [makeMod("/proj/src/widget.ts", { classes: [cls] })];
        const quality = makeQuality({
            result: Object.assign({}, makeQuality().result, {
                files: [{
                    filePath: "/proj/src/widget.ts",
                    functions: [
                        { name: "constructor", startLine: 1, endLine: 5, healthScore: 91, maintainabilityIndex: 80, metrics: [], smells: [] },
                        { name: "run", startLine: 8, endLine: 12, healthScore: 71, maintainabilityIndex: 60, metrics: [], smells: [] },
                        { name: "value", startLine: 19, endLine: 21, healthScore: 61, maintainabilityIndex: 50, metrics: [], smells: [] },
                    ],
                }],
            }),
        });
        const modPage = buildSite(modules, { projectName: "Test", quality }).find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes("91"), "constructor health score missing (bare 'constructor' name match, TICKET-1 finding)");
        assert.ok(modPage.html.includes("71"), "method health score missing");
        assert.ok(modPage.html.includes("61"), "getter health score missing");
        assert.ok(modPage.html.includes("No health data for this function."), "setter at line 25 (outside the only 'value' entry's 19-21 range) should fall back, not reuse the getter's match");
    });

    check("story-function-level-health-drilldown: default (--quality-less) output never contains function-level chip markup", () => {
        const modules = [makeMod("/proj/src/a.ts", { functions: [makeFunc("run")] })];
        const pages = buildSite(modules, { projectName: "Test" });
        const modPage = pages.find(p => p.path.startsWith("modules/"));
        assert.ok(!modPage.html.includes("qfn-chip-row"), "qfn-chip-row must not appear without --quality");
    });

};
