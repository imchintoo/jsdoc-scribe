"use strict";

/**
 * Renderer unit tests — tests lib/renderer.js buildSite() in isolation.
 * Uses lightweight mock module objects (no file I/O or TS compilation needed)
 * to exercise HTML output, search index, TOC, badges, highlighting, and links.
 */

const assert  = require("assert");
const { buildSite, pathTree, ancestorChain, cardBreadcrumb, CSS_STRUCTURE,
        buildArchitectureSection, renderStructureNode, buildArchitecturePage } = require("../lib/renderer.js");

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

    check("CSS_STRUCTURE: phase-o design-system-v2 tokens present, matching the jsdoc-scribe Figma Make reference", () => {
        assert.ok(CSS_STRUCTURE.includes("IBM+Plex+Sans") && CSS_STRUCTURE.includes("JetBrains+Mono"), "Google Fonts @import for IBM Plex Sans / JetBrains Mono missing");
        assert.ok(CSS_STRUCTURE.includes('--font-display:"Geist"'), "--font-display token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes('--font-body:"IBM Plex Sans"'), "--font-body token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes('--font-mono:"JetBrains Mono"'), "--font-mono token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes("--bg:#0F1115"), "--bg not set to the reference's dark canvas value");
        assert.ok(CSS_STRUCTURE.includes("--surface:#171A20"), "--surface not set to the reference's dark card value");
        assert.ok(CSS_STRUCTURE.includes("--accent:#7382FF") && CSS_STRUCTURE.includes("--accent-hover:#4D5BFF"), "--accent/--accent-hover not set to the reference's brand values");
        assert.ok(CSS_STRUCTURE.includes("--success:#34D399") && CSS_STRUCTURE.includes("--warning:#FBBF24") && CSS_STRUCTURE.includes("--danger:#F87171") && CSS_STRUCTURE.includes("--info:#38BDF8"), "semantic status tokens missing/wrong");
        ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-pill"].forEach(function (t) {
            assert.ok(CSS_STRUCTURE.includes(t + ":"), t + " radius-scale token missing");
        });
        assert.ok(CSS_STRUCTURE.includes("--ease:cubic-bezier(0.215,0.610,0.355,1.000)"), "--ease motion token missing/wrong");
        assert.ok(CSS_STRUCTURE.includes("--shadow-card:") && CSS_STRUCTURE.includes("--shadow-inset-dark:"), "shadow tokens missing");
        assert.ok(CSS_STRUCTURE.includes(".icon{"), "shared .icon class missing (SVG icon system)");
        assert.ok(CSS_STRUCTURE.includes(".qhero{") && CSS_STRUCTURE.includes(".qhero-gauge-svg{"), "qhero/gauge-svg positioning rules missing");
        assert.ok(CSS_STRUCTURE.includes(".sidebar-mark{"), "sidebar brand mark styling missing");
    });

    check("gen-docs default (--quality-less) output is byte-for-byte unaffected by the phase-o token pass", () => {
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

    check("CSS_STRUCTURE: architecture tree/badge redesign selectors present (2026-07-15)", () => {
        assert.ok(CSS_STRUCTURE.includes(".arch-tree"), ".arch-tree wrapper selector missing");
        assert.ok(CSS_STRUCTURE.includes(".arch-tree .collapse-body"), "scoped tree-indent/guide-line rule missing");
        assert.ok(CSS_STRUCTURE.includes(".arch-badges{"), ".arch-badges missing");
        assert.ok(CSS_STRUCTURE.includes(".arch-badge{"), ".arch-badge missing");
        assert.ok(CSS_STRUCTURE.includes(".arch-node-name{"), ".arch-node-name missing");
    });

    check("CSS_STRUCTURE/renderer: sidebar width increased to 224px (2026-07-15 detail-page-polish)", () => {
        assert.ok(CSS_STRUCTURE.includes("--sidebar-w:224px"), "--sidebar-w should be 224px, not the old 192px");
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

    // -----------------------------------------------------------------------
    // task-arch-04 — Architecture page (buildArchitectureSection /
    // renderStructureNode / buildArchitecturePage). See
    // docs/backlog/adr-architecture-render-phase4.md and
    // docs/backlog/ux-architecture-render-phase4.md.
    // -----------------------------------------------------------------------

    function makeStructureNode(overrides) {
        return Object.assign({
            name: "lib",
            description: "Core library.",
            files: { ".js": 3 },
            children: undefined,
        }, overrides);
    }

    function makeFacts(overrides) {
        return Object.assign({
            structure: [],
            workspacePackages: [],
            frameworkSignals: [],
            architectureSignals: [],
            architecturePatterns: [],
        }, overrides);
    }

    check("buildArchitectureSection: returns \"\" when facts is absent", () => {
        assert.strictEqual(buildArchitectureSection(null), "");
        assert.strictEqual(buildArchitectureSection(undefined), "");
    });

    check("buildArchitectureSection: returns \"\" when every relevant field is empty", () => {
        assert.strictEqual(buildArchitectureSection(makeFacts()), "");
    });

    check("buildArchitectureSection: non-empty facts render pattern -> framework -> structure sections in DOM order (UX §1/§3)", () => {
        const facts = makeFacts({
            architectureSignals: [{ name: "CLI tool", evidence: 'package.json "bin": jsdoc-scribe' }],
            frameworkSignals: [{ name: "React", confidence: "dependency", evidence: '"react" in package.json dependencies' }],
            structure: [makeStructureNode()],
        });
        const html = buildArchitectureSection(facts);
        const patternIdx = html.indexOf("WHAT KIND OF PROJECT IS THIS");
        const frameworkIdx = html.indexOf("WHAT IT'S BUILT WITH");
        const structureIdx = html.indexOf("HOW IT'S ORGANIZED");
        assert.ok(patternIdx !== -1 && frameworkIdx !== -1 && structureIdx !== -1, "all three section titles should be present");
        assert.ok(patternIdx < frameworkIdx && frameworkIdx < structureIdx, "sections must appear in pattern -> framework -> structure DOM order");
    });

    check("buildArchitectureSection: pattern-signal section omitted when architectureSignals is empty (framework/structure still render)", () => {
        const facts = makeFacts({
            frameworkSignals: [{ name: "Vue", confidence: "dependency", evidence: '"vue" in package.json dependencies' }],
            structure: [makeStructureNode()],
        });
        const html = buildArchitectureSection(facts);
        assert.ok(!html.includes("WHAT KIND OF PROJECT IS THIS"), "pattern section should be omitted with zero architecture signals");
        assert.ok(html.includes("WHAT IT'S BUILT WITH"), "framework section should still render");
        assert.ok(html.includes("HOW IT'S ORGANIZED"), "structure section should still render");
    });

    check("buildArchitectureSection: structure section still renders (with a .qempty message) when structure is [] but another category is non-empty", () => {
        const facts = makeFacts({
            architectureSignals: [{ name: "Publishable library", evidence: 'package.json has a "exports" field' }],
        });
        const html = buildArchitectureSection(facts);
        assert.ok(html.includes("HOW IT'S ORGANIZED"), "structure section header should still render");
        assert.ok(html.includes("No subdirectories found at the top level of this project."), "empty-structure message missing");
        assert.ok(html.includes("qempty"), "empty-structure message should use the .qempty style");
    });

    check("buildArchitectureSection: workspace packages render as .module-card entries, description line omitted only when null", () => {
        const facts = makeFacts({
            workspacePackages: [
                { name: "eslint-plugin-jsdoc-scribe", path: "packages/eslint-plugin-jsdoc-scribe", description: "ESLint rules for jsdoc-scribe." },
                { name: "no-desc-pkg", path: "packages/no-desc-pkg", description: null },
            ],
            structure: [makeStructureNode()],
        });
        const html = buildArchitectureSection(facts);
        assert.ok(html.includes("Workspace packages"), "Workspace packages sub-heading missing");
        assert.ok(html.includes("module-grid") && html.includes("module-card"), "expected reuse of .module-grid/.module-card");
        assert.ok(html.includes("eslint-plugin-jsdoc-scribe") && html.includes("ESLint rules for jsdoc-scribe."), "package name/description missing");
        assert.ok(html.includes("no-desc-pkg"), "package with a null description should still render its card");
    });

    check("buildArchitectureSection: architecturePatterns render as their own section with name/evidence/description/Learn-more link (2026-07-15)", () => {
        const facts = makeFacts({
            architecturePatterns: [
                {
                    name: "Layered (N-Tier)",
                    description: "Code is split into horizontal layers -- presentation, business logic, data access.",
                    link: "https://en.wikipedia.org/wiki/Multitier_architecture",
                    evidence: "directories present: controllers, services",
                },
            ],
        });
        const html = buildArchitectureSection(facts);
        assert.ok(html.includes("ARCHITECTURAL PATTERN"), "expected an ARCHITECTURAL PATTERN(S) section heading");
        assert.ok(html.includes("Layered (N-Tier)"), "pattern name missing");
        assert.ok(html.includes("directories present: controllers, services"), "evidence line missing");
        assert.ok(html.includes("Code is split into horizontal layers"), "description missing");
        assert.ok(html.includes('href="https://en.wikipedia.org/wiki/Multitier_architecture"'), "Learn-more link missing/wrong URL");
        assert.ok(html.includes("target=\"_blank\""), "external reference link should open in a new tab");
    });

    check("buildArchitectureSection: architecturePatterns section is omitted (not an empty heading) when the array is empty", () => {
        const html = buildArchitectureSection(makeFacts({ structure: [makeStructureNode()] }));
        assert.ok(!html.includes("ARCHITECTURAL PATTERN"), "should not render the section heading with zero detected patterns");
    });

    check("buildArchitectureSection: architecturePatterns alone (everything else empty) is still enough to render the page section", () => {
        const html = buildArchitectureSection(makeFacts({
            architecturePatterns: [{ name: "Monolith", description: "x".repeat(50), link: "https://en.wikipedia.org/wiki/Monolithic_application", evidence: "single package.json" }],
        }));
        assert.notStrictEqual(html, "", "a non-empty architecturePatterns array alone should be enough for buildArchitectureSection to render something");
        assert.ok(html.includes("Monolith"));
    });

    check("buildArchitectureSubtitle: includes the architecture-pattern count segment alongside the existing three", () => {
        const facts = makeFacts({
            architectureSignals: [{ name: "CLI tool", evidence: "x" }],
            architecturePatterns: [{ name: "Monolith", description: "x".repeat(50), link: "https://en.wikipedia.org/wiki/Monolithic_application", evidence: "x" }],
            structure: [makeStructureNode()],
        });
        const modules = [];
        const page = buildArchitecturePage(facts, modules, "Test", "1.0.0", pathTree(modules), "", new Map(), false);
        assert.ok(page.html.includes("1 architecture pattern"), "expected the new architecture-pattern count segment in the subtitle");
    });

    // -- phrasing-table fidelity (UX §2.5), one example per table row --------

    check("buildArchitectureSection: CLI tool phrasing matches UX §2.5's template", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "CLI tool", evidence: 'package.json "bin": jsdoc-scribe' }] }));
        assert.ok(html.includes("package.json declares a"), "missing lead-in clause");
        assert.ok(html.includes("<code>bin</code>"), "bin should render as code, not a raw label");
        assert.ok(html.includes("<code>jsdoc-scribe</code>"), "bin name should render as code");
        assert.ok(html.includes("this can be run as a command from the terminal."), "missing trailing clause");
        assert.ok(!html.includes('package.json "bin": jsdoc-scribe'), "raw evidence string must never appear un-wrapped");
    });

    check("buildArchitectureSection: Publishable library phrasing matches UX §2.5's template (exports field)", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "Publishable library", evidence: 'package.json has a "exports" field' }] }));
        assert.ok(html.includes("<code>exports</code>"), "field name should render as code");
        assert.ok(html.includes("that's how a package exposes its public API to whoever installs it."), "missing trailing clause");
    });

    check("buildArchitectureSection: Monorepo phrasing matches UX §2.5's template", () => {
        const evidence = "3 workspace package(s): eslint-plugin-jsdoc-scribe, pkg-b, pkg-c";
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "Monorepo (npm workspaces)", evidence }] }));
        assert.ok(html.includes("this repo hosts 3 workspace packages"), "missing lead-in clause with real count");
        assert.ok(html.includes("<code>eslint-plugin-jsdoc-scribe</code>"), "package name should render as code");
        assert.ok(html.includes("managed via npm workspaces."), "missing trailing clause");
    });

    check("buildArchitectureSection: Backend/API service phrasing matches UX §2.5's template", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "Backend/API service", evidence: "framework dependency: Express, NestJS" }] }));
        assert.ok(html.includes("depends on server frameworks (Express, NestJS)"), "missing named frameworks clause");
        assert.ok(html.includes("typically used to build an API or backend."), "missing trailing clause");
    });

    check("buildArchitectureSection: MVC-influenced layout phrasing matches UX §2.5's template", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "MVC-influenced layout", evidence: "directories present: controllers, models, views" }] }));
        assert.ok(html.includes("<code>controllers/</code>") && html.includes("<code>models/</code>") && html.includes("<code>views/</code>"), "directory names should render as code with trailing slash");
        assert.ok(html.includes("a naming convention commonly associated with MVC."), "missing trailing clause");
    });

    check("buildArchitectureSection: Layered/service-oriented layout phrasing matches UX §2.5's template", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "Layered/service-oriented layout", evidence: "directories present: routes, services" }] }));
        assert.ok(html.includes("directory names like"), "missing lead-in clause");
        assert.ok(html.includes("<code>routes/</code>") && html.includes("<code>services/</code>"), "directory names should render as code");
        assert.ok(html.includes("suggest the code is organized by responsibility, in layers."), "missing trailing clause");
    });

    check("buildArchitectureSection: unmatched architecture-signal evidence shape falls back to the general rule, never raw/un-wrapped (UX §2.5)", () => {
        const html = buildArchitectureSection(makeFacts({ architectureSignals: [{ name: "Frontend application", evidence: "framework dependency: React, Next.js" }] }));
        assert.ok(html.includes("React, Next.js"), "actual evidence should still be named");
        assert.ok(html.includes("Frontend application"), "signal name should render as the card title");
    });

    check("buildArchitectureSection: framework dependency-confidence phrasing matches UX §2.5's template + DEPENDENCY MATCH chip", () => {
        const html = buildArchitectureSection(makeFacts({ frameworkSignals: [{ name: "React", confidence: "dependency", evidence: '"react" in package.json dependencies' }] }));
        assert.ok(html.includes("package.json lists it as a dependency"), "missing lead-in clause");
        assert.ok(html.includes('<code>"react"</code>'), "dependency marker should render as code");
        assert.ok(html.includes("DEPENDENCY MATCH"), "expected DEPENDENCY MATCH chip text");
        assert.ok(!html.includes("confidence"), "the literal word 'confidence' must never render");
        assert.ok(!html.includes(">dependency<"), "the raw enum value must never render bare");
    });

    check("buildArchitectureSection: framework file-heuristic phrasing matches UX §2.5's template + FILE PATTERN chip", () => {
        const html = buildArchitectureSection(makeFacts({ frameworkSignals: [{ name: "React", confidence: "file-heuristic", evidence: ".tsx files present, no matching dependency found in any package.json" }] }));
        assert.ok(html.includes("no <code>react</code> dependency found"), "missing negative-dependency clause with the correct marker");
        assert.ok(html.includes("<code>.tsx</code> files"), "extension should render as code");
        assert.ok(html.includes("common signal for React."), "missing trailing clause");
        assert.ok(html.includes("FILE PATTERN"), "expected FILE PATTERN chip text");
    });

    // -- renderStructureNode ---------------------------------------------------

    check("renderStructureNode: depth-0 node renders <details open>, depth>0 renders collapsed by default (UX §2.6)", () => {
        const node = makeStructureNode({ children: [makeStructureNode({ name: "utils", children: undefined })] });
        const topHtml = renderStructureNode(node, 0);
        assert.ok(topHtml.startsWith("<details open>"), "depth-0 node should render <details open>");
        const nestedHtml = renderStructureNode(node.children[0], 1);
        assert.ok(nestedHtml.startsWith("<details><summary"), "depth>0 node should render collapsed (<details> without open)");
        assert.ok(topHtml.includes("<details><summary"), "nested child inside a depth-0 node's own recursive render should itself be collapsed");
        assert.ok(topHtml.includes("collapse-toggle") && topHtml.includes("collapse-body"), "expected reuse of .collapse-toggle/.collapse-body, not sidebar-item-details");
    });

    check("renderStructureNode: a children array over 40 entries renders only the first 40 plus a static +N more line", () => {
        const many = [];
        for (let i = 0; i < 45; i++) {
            many.push(makeStructureNode({ name: "dir" + String(i).padStart(2, "0"), children: undefined, description: null }));
        }
        const node = makeStructureNode({ name: "root", children: many });
        const html = renderStructureNode(node, 0);
        assert.ok(html.includes("dir00"), "first entry missing");
        assert.ok(html.includes("dir39"), "40th entry (index 39) should be present");
        assert.ok(!html.includes("dir40"), "41st entry should NOT be rendered (cap is 40)");
        assert.ok(html.includes("+5 more"), "expected a static '+5 more' line for the remaining 5 entries");
    });

    check("renderStructureNode: KNOWN_DIR_DESCRIPTIONS sentinel is never rendered verbatim; a real description renders", () => {
        const sentinelHtml = renderStructureNode(makeStructureNode({ description: "(no description on file -- inspect directly)" }), 0);
        const realHtml = renderStructureNode(makeStructureNode({ description: "Core library." }), 0);
        assert.ok(!sentinelHtml.includes("no description on file"), "sentinel fallback description must never render verbatim");
        assert.ok(realHtml.includes("Core library."), "a real KNOWN_DIR_DESCRIPTIONS description should render");
    });

    check("renderStructureNode: file-type badges render per category, colored, with a folder-count badge (2026-07-15 tree/badge redesign)", () => {
        const node = makeStructureNode({
            files: { ".js": 12, ".test.js": 4, ".md": 2, ".json": 1, ".yml": 1, ".txt": 1 },
            children: [makeStructureNode({ name: "utils", children: undefined })],
        });
        const html = renderStructureNode(node, 0);
        assert.ok(html.includes("arch-badges"), "expected the .arch-badges wrapper");
        // .js + .test.js both end in .js -> bucketed into one "JavaScript" badge (16 total)
        assert.ok(html.includes(">16 JavaScript<"), "JavaScript badge should sum .js + .test.js counts");
        // .md/.yml/.txt don't match any headline category -> bucketed as "other" (2+1+1=4)
        assert.ok(html.includes(">4 other<"), "uncategorized extensions should sum into one 'other' badge");
        // 1 child directory -> a folder-count badge
        assert.ok(html.includes(">1 folder<"), "expected a singular '1 folder' badge for the one child directory");
        assert.ok(html.includes("arch-node-name"), "directory name should render with the .arch-node-name class");
    });

    check("renderStructureNode: TypeScript/CSS/JSON categories each get their own colored badge", () => {
        const node = makeStructureNode({
            files: { ".ts": 5, ".tsx": 3, ".css": 2, ".scss": 1, ".json": 4 },
            children: undefined,
        });
        const html = renderStructureNode(node, 0);
        assert.ok(html.includes(">8 TypeScript<"), "TypeScript badge should sum .ts + .tsx");
        assert.ok(html.includes(">3 CSS<"), "CSS badge should sum .css + .scss");
        assert.ok(html.includes(">4 JSON<"), "JSON badge missing");
        assert.ok(!html.includes(">0 folder"), "no folder badge should render when there are no children");
    });

    check("buildArchitectureSection: structure tree is wrapped in .arch-tree for the tree-indent/guide-line CSS", () => {
        const html = buildArchitectureSection(makeFacts({ structure: [makeStructureNode()] }));
        assert.ok(html.includes('class="arch-tree"'), "expected the .arch-tree wrapper div around the rendered structure");
    });

    // -- buildArchitecturePage / buildSite integration --------------------------

    check("buildSite: options.facts present and non-empty -> architecture.html page + sidebar navbutton on every page", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const facts = makeFacts({ architectureSignals: [{ name: "CLI tool", evidence: 'package.json "bin": jsdoc-scribe' }] });
        const pages = buildSite(modules, { projectName: "Test", facts });
        const archPage = pages.find(p => p.path === "architecture.html");
        assert.ok(archPage, "architecture.html should be generated when facts has at least one signal");
        assert.ok(archPage.html.includes(">Architecture<"), "page title missing");
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(idx.html.includes('href="architecture.html">Architecture</a>'), "Architecture navbutton missing from index.html sidebar");
        const modPage = pages.find(p => p.path.startsWith("modules/"));
        assert.ok(modPage.html.includes('href="../architecture.html">Architecture</a>'), "Architecture navbutton missing from module page sidebar (relative href)");
    });

    check("buildSite: options.facts absent -> no architecture.html page, no navbutton anywhere (unchanged existing behavior)", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const pages = buildSite(modules, { projectName: "Test" });
        assert.ok(!pages.some(p => p.path === "architecture.html"), "architecture.html should not exist without facts");
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(!idx.html.includes(">Architecture</a>"), "no Architecture navbutton should appear without facts");
    });

    check("buildSite: options.facts present but every category empty -> no architecture.html page, no navbutton (ADR Decision 3)", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const pages = buildSite(modules, { projectName: "Test", facts: makeFacts() });
        assert.ok(!pages.some(p => p.path === "architecture.html"), "architecture.html should not exist when facts are all-empty");
        const idx = pages.find(p => p.path === "index.html");
        assert.ok(!idx.html.includes(">Architecture</a>"), "no Architecture navbutton should appear when facts are all-empty");
    });

    check("buildSite: options.isSnapshot true -> architecture.html never rendered even when facts are present (ADR Decision 6)", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const facts = makeFacts({ architectureSignals: [{ name: "CLI tool", evidence: 'package.json "bin": jsdoc-scribe' }] });
        const pages = buildSite(modules, { projectName: "Test", facts, isSnapshot: true });
        assert.ok(!pages.some(p => p.path === "architecture.html"), "architecture.html must never render for a historical snapshot render, even with facts present");
    });

    check("buildArchitecturePage: subtitle omits zero-count segments (UX §2.1)", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const facts = makeFacts({ structure: [makeStructureNode()] });
        const page = buildArchitecturePage(facts, modules, "Test", "1.0.0", pathTree(modules), "", new Map(), false);
        assert.ok(page, "buildArchitecturePage should return a page when structure is non-empty");
        assert.ok(page.html.includes("1 top-level directory"), "structure count segment missing");
        assert.ok(!page.html.includes("pattern signal"), "zero-count pattern-signal segment should be omitted");
        assert.ok(!page.html.includes("framework signal"), "zero-count framework-signal segment should be omitted");
    });

    check("buildArchitecturePage: returns null when buildArchitectureSection(facts) is empty", () => {
        const modules = [makeMod("/proj/src/a.ts")];
        const result = buildArchitecturePage(makeFacts(), modules, "Test", "1.0.0", pathTree(modules), "", new Map(), false);
        assert.strictEqual(result, null, "buildArchitecturePage should return null for empty facts");
    });

};
