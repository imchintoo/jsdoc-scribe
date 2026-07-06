## [1.17.0] - 2026-07-05

### Added
- **Internal AST ergonomics layer**: new `lib/ast-utils.js` module with four small, purpose-built traversal/guard helpers built directly on the `typescript` Compiler API — `getDescendantsOfKind(node, kind)`, `findFirstDescendant(node, predicate, stopAt)`, `asClass(node)`, `asFunctionLike(node)`. Not part of the public API; internal-only.

### Changed
- Internal: `lib/extractor.js`'s traversal internals migrated onto the new helpers — `hasReturnWithValue`'s hand-rolled walk is now `findFirstDescendant` with a `stopAt` boundary, and the local `isFunctionLike`/class-dispatch checks now go through `asFunctionLike`/`asClass`. Zero output/behavior change (verified via a line-number-normalized diff of `extractModule()` across every file in `lib/` and `bin/`, plus a `gen-comments --dry-run` sanity check) — no new npm dependency, still just `typescript`.
- Test suite grew from 88 to 101 assertions (13 new, covering the ast-utils helpers directly, including nested-function boundary behavior).

## [1.16.0] - 2026-07-02

### Added
- **Drift detection**: new `--check-drift` flag for `gen-comments` compares existing JSDoc blocks against the current code and flags missing params, removed (stale) params, and return-type mismatches. Read-only and CI-friendly — exits 1 if drift is found, exits 0 otherwise, and never modifies source files.
- **Coverage badges**: new `--coverage-badge <dir>` flag for `gen-comments` aggregates documentation coverage across a target path and writes a self-contained, shields.io-style `coverage-badge.svg` plus a `coverage-summary.json`. No network dependency — fully offline and deterministic.
- **N-level sidebar navigation**: the generated docs site sidebar now renders an unbounded-depth collapsible folder tree (previously capped at 2 levels), with the active module's ancestor folders auto-expanded. Full keyboard navigation (arrow keys) and screen-reader support (ARIA tree semantics).
- **Breadcrumb context on the index page**: module cards for nested files now show a directory breadcrumb (e.g. `helpers / server`) above the filename, so it's clear where a module lives at a glance. Deeply nested paths truncate to keep cards tidy.

### Changed
- Internal: `--check`'s coverage math now goes through a shared `aggregateCoverage()` helper (also used by `--coverage-badge`) instead of being computed inline — output is unchanged, this just avoids having the same math defined twice.

### Fixed
- Module cards on the documentation index page now include a `title` attribute with the full relative path on hover, matching the tooltip behavior individual symbols already had.

## [1.15.0] - 2026-07-01

### Changed
- Phase H: Smart sidebar grouping — strips deeper common root from module labels, caps group nesting at 2 dir segments
- Sidebar group labels now show only the deepest relevant directory name (not the full path), fixing the verbose UPPERCASE path bug
- Module links inside groups show only the filename, with the full relative path in `title` for hover tooltips
- Sidebar section title and dir-toggle headers are now sticky (position:sticky) so they stay visible while scrolling
- Index page module cards display shortened labels (deep common root stripped)
- Empty-state message in `buildModuleBody` upgraded to styled `<div class="empty">` with explicit "No exported items in this module." text
- Index page module cards show "No exported items" italic note for modules with zero exports
- New helpers: `deeperCommonRoot()` and `hasExports()` added to renderer.js

## [1.14.0] - 2026-07-01

### Changed
- Phase G: Stripe-style documentation layout (v1.14.0)
- New sticky top navigation bar with project name (top-left) and centered search
- Sidebar redesigned: white background, uppercase section headers, accent-colored active links
- Right-side TOC restored ("On this page") with scroll-spy via IntersectionObserver
- Three-column CSS Grid layout: sidebar (240px) | main (1fr) | toc (200px)
- Card scroll-margin-top updated for topnav offset
- Search moved from sidebar to topnav center; "/" and Ctrl+K shortcuts
- Accent color: #625bf6 (Stripe purple)
- Hamburger toggle updated for overlay sidebar on mobile

# Changelog

All notable changes to `jsdoc-scribe` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.13.0] - 2026-07-01

### Changed — Phase F: Single-design documentation site

**`lib/renderer.js` — complete visual redesign**
- Removed `THEMES` map and all CSS-variable-based theming; single built-in design replaces it
- Dark blue sidebar (`#0a2540`) with white text and `#00d4ff` active link highlight
- Light content area (`#f6f9fc` background) with white symbol cards
- **Two-column card layout**: each symbol card is a CSS grid split — left prose panel (description, params, returns, throws) and right dark code panel (`#1a2e44`)
- Right code panel shows `@example` content when present; falls back to the type/class signature
- Removed right-side TOC column entirely: `buildToc()` deleted, `has-toc` class gone, `IntersectionObserver` scroll-spy removed from `CLIENT_JS`
- Removed dark/light mode toggle button from sidebar
- Responsive: code panel collapses below prose at ≤860 px; sidebar becomes hamburger overlay at ≤720 px
- New helpers: `card()`, `codePanel()`, `buildFnSig()`, `buildClassSig()`, `buildIfaceSig()`
- Retained: Ctrl+K search, copy button, mobile hamburger, sidebar symbol tree with kind pills

**`bin/gen-docs.js` — flag removal**
- Removed `--theme` / `-T` flag and `VALID_THEMES` constant; theme option silently ignored if present in config file for backward compatibility

---

## [1.12.0] - 2026-06-30

### Added — Phase E: Smart Comment Generation + CI tooling

**`lib/inferrer.js` (new module)**
Pure heuristic engine — no AI, no external calls. Maps camelCase names to natural English descriptions at build time.
- `splitCamel(name)` — splits `getUserById` → `["get","user","by","id"]`, handles consecutive uppercase runs (`HTMLParser` → `["html","parser"]`)
- `inferFunctionDescription(name, mods)` — 85+ verb-prefix templates covering `get/set/is/has/create/delete/validate/emit/handle/...`. `isUserActive` → "Returns whether the user is active." `createPaymentIntent` → "Creates a new payment intent."
- `inferParamDescription(name)` — ~100 well-known parameter names mapped to concise descriptions. `userId` → "user unique identifier." `callback` → "callback function invoked on completion." `maxRetries` → "max number of retry attempts." Suffix matching handles compound names like `filePath` → `path to the file`.
- `inferClassDescription(name)` — 50+ class-name suffix templates. `UserService` → "Service responsible for user operations." `ValidationError` → "Error thrown when validation related issues occur."

**`lib/index.js` — smarter comment generation**
- Generated function comments now open with a meaningful description line instead of a `[Description]` placeholder
- `@param` lines now include inferred descriptions: `@param {string} userId - user unique identifier.`
- `@throws` auto-detection: scans the function/method body AST for `throw new SomeError(...)` and adds `@throws {SomeError}` tags automatically — without descending into nested functions
- Getter/setter accessors get natural descriptions: "Returns the X." / "Sets the X."
- Removed redundant `@function`, `@class`, `@exported` tags from generated blocks
- `void` return type no longer emitted on methods that have nothing to return
- New `dryRun` option in `processFile()` — analyses without writing
- New `analyseFile(filePath)` export — returns `{ documented, total, undocumented }` without modifying the file

**`bin/cli.js` — new flags**
- `--dry-run` / `-n`: shows which symbols would be documented (per file) without writing anything
- `--check` / `-C`: like `--dry-run` but exits with code `1` if any symbols are undocumented — use as a CI gate to enforce coverage

**Tests expanded from 25 → 30**
- Verb-prefix description inference (`getUserById` → "Returns the user by id.")
- `@throws` auto-detection from AST
- Class-name description inference (`UserService` → "Service responsible for…")
- `analyseFile()` returning correct undocumented count
- `analyseFile()` returning 0 undocumented after `processFile`

---

## [1.11.0] - 2026-06-30

### Changed — Code Quality (Phase D)

**`extractor.js` robustness**
- Added `sourceFile` null guard: if `ts.createSourceFile()` returns a falsy value the function logs to stderr and returns an empty-but-valid module object instead of throwing.
- Wrapped the entire `visit(node)` body in `try/catch`: a malformed or unexpected AST node now logs a warning (`jsdoc-scribe: skipped node in <file> — <message>`) and continues visiting sibling nodes instead of aborting the whole module.

**`renderer.js` refactor**
- Extracted `buildSymbolMap(modules)` from `buildSite()` — builds the `{name → {anchorId, modulePath}}` cross-reference map used by `{@link}` resolution.
- Extracted `buildIndexBody(modules)` — builds the module-grid HTML block for the index page (previously inlined in `buildSite()`).
- Extracted `buildModuleBody(mod, sourceUrl, symbolMap)` — builds the sections HTML for a single module page (previously inlined in `buildSite()`).
- `buildSite()` is now a slim coordinator (~25 lines) delegating to the three helpers above.

**`docs.js` async upgrade**
- `extractModules(files)` is now `async` and uses `Promise.allSettled`: all files are attempted in parallel; fulfilled results are collected, rejected ones are logged to stderr and skipped.
- `generateSite(inputPaths, options)` is now `async` accordingly.

---

## [1.10.0] - 2026-06-30

### Added — Test coverage (Phase C)

Expanded `npm test` from 7 tests to **25 tests** across three suites.

**`test/extractor.test.js` — 10 new tests** (exercises `lib/extractor.js`):
- Module-level `@module` description and `@since` extracted from top-of-file JSDoc
- `@param` type and description parsed from JSDoc block
- `@returns` type and description parsed
- `@since` and `@deprecated` on individual items
- `@throws` with type and description
- 1-based source line numbers on all functions (ordered)
- Class with constructor, methods, properties, and static members
- Interface with optional properties
- Enum members and their values
- Type alias and exported `const` variable

**`test/renderer.test.js` — 8 new tests** (exercises `lib/renderer.js` via mock module objects):
- `buildSite` returns exactly 3 shared assets + `index.html` + one page per module
- Search index contains every symbol (function, class) with root-relative URLs
- Module page includes right-side TOC with `data-anchor` attributes and "On this page" title
- `@deprecated` badge and notice rendered for deprecated items
- Source link contains GitHub URL and `#L42` line anchor when `sourceUrl` set
- `@example` blocks rendered with `tok-kw` syntax-highlighting spans
- Sidebar symbol tree includes `sym-rows` and kind pills for the active module
- `{@link Symbol}` in descriptions resolves to `<a class="link-ref">` with `href`

### Fixed — `@description` tag in JSDoc blocks

`parseJSDocBlock()` now recognises `@description <text>` as an alias for the plain-text
description that precedes the first `@tag`. Previously `@description` was silently discarded as
an unknown tag, leaving `mod.description === null` for any file that used it (including all
built-in sample files).

---

## [1.9.0] - 2026-06-30

### Changed — Enterprise HTML Redesign (Phase B)

Complete visual overhaul of the generated documentation site.

**Three-column layout**
- Left sidebar (272 px) · Center content (flexible) · Right TOC (224 px)
- CSS Grid replaces the old flexbox layout: `.layout { grid-template-columns: 272px 1fr 224px }`
- Index page uses two-column grid (no right TOC); module pages use three columns automatically via the `has-toc` class

**Right-side "On this page" TOC**
- New `buildToc(mod)` function generates a per-section TOC (Functions, Classes, Interfaces, etc.) with every symbol as a clickable anchor
- `IntersectionObserver` scroll spy in `app.js` tracks which card is on screen and highlights the matching TOC item with an accent-colored left border
- TOC hides at ≤1280 px viewport width; three columns collapse to two

**Symbol tree in sidebar**
- Active module expands to show every symbol underneath its file link
- Each symbol is prefixed with a color-coded pill badge (`fn`, `cls`, `if`, `ty`, `en`, `$`) matching its kind
- New `.sym-rows`, `.sym-row`, `.sym-pill`, `.sym-link` CSS classes

**Color-coded cards**
- Each card now has a 3 px left accent border: green=function, blue=class, purple=interface, orange=enum, teal=type alias, gray=variable/const
- Added `card-fn`, `card-cls`, `card-iface`, `card-enum`, `card-type`, `card-var` CSS classes to all render functions

**Server-side syntax highlighting for `@example` blocks**
- New `highlightCode(raw)` function in `renderer.js` tokenizes JS/TS code at build time
- Handles line comments, block comments, strings (single/double/template), numbers, and 40+ keywords
- Produces `<span class="tok-kw|tok-str|tok-cmt|tok-num">` spans; colors adapt to dark/light theme via CSS vars

**Responsive layout**
- `@media (max-width: 1280px)`: right TOC hidden, grid collapses to two columns
- `@media (max-width: 860px)`: sidebar becomes a fixed overlay (off-screen by default), hamburger button appears in the top-left, main content uses mobile padding
- Hamburger toggle with animated open/close icon (three-bar → X)

**Print styles**
- `@media print`: sidebar, TOC, hamburger, copy buttons, theme toggle, and search box all hidden
- Cards get `break-inside: avoid` and a neutral border for clean PDF output

**Section counts**
- Section headings now show item count: `Functions (3)` using a `.section-count` monospace chip

**Other polish**
- `html { scroll-behavior: smooth }` for smooth anchor navigation
- Sidebar active link gets a 2 px accent left border instead of just a background change
- Card hover adds a subtle box-shadow
- All `section()` calls updated with count display
- CSS ~15 KB (up from ~9 KB), app.js ~4 KB (up from ~2.6 KB) — still cached after first load

---

## [1.8.0] - 2026-06-30

### Changed — Performance: Shared Static Assets (Phase A)

Previously every generated HTML page inlined the same 9 KB CSS block, 3 KB client JS, and 34 KB search index. On a 9-page site that wasted 630+ KB of duplicate payload.

- **CSS extracted** to `assets/style.css` — written once per build, shared by all pages via `<link rel="stylesheet">`.
- **Client JS extracted** to `assets/app.js` — written once, shared via `<script src>`. Browsers cache it after the first page load.
- **Search index extracted** to `search-index.js` — written once as `window.__SEARCH_INDEX__=[...]`, loaded before `app.js` via `<script src>`. No more 34 KB inline JSON on every page.
- `app.js` auto-detects its location (`/modules/` in the path) and adjusts search result URLs at runtime, so a single shared index file works for both the index page and all module pages.

### Result
| Metric | Before | After |
|---|---|---|
| Total site size | 628 KB | 225 KB (−64%) |
| Per-page HTML (avg) | ~70 KB | ~20 KB |
| Cache benefit (2nd+ page) | ~70 KB reload | ~20 KB reload |
| Shared assets (loaded once) | — | 46 KB |

### Upgraded — `buildSite()` output
The return array now includes three additional entries: `{ path: 'assets/style.css', html: '...' }`, `{ path: 'assets/app.js', html: '...' }`, `{ path: 'search-index.js', html: '...' }`. The CLI handles these automatically. Programmatic API users should use `fs.mkdirSync(path.dirname(dest), { recursive: true })` before writing each file (the README example is updated).

---

## [1.7.0] - 2026-06-29

### Added
- **Module-level JSDoc** (`@module` / `@description` at top of file): `extractModuleDoc()` in `extractor.js` reads the first `/** */` block before any declarations and extracts `description`, `moduleName`, and `@since`. Module pages now show a description paragraph below the file path; index cards show a 2-line truncated preview.
- **Per-module index stats**: each index card now shows a symbol breakdown (`fn · class · iface · enum · const`), `@since` version range across all items (e.g. `since v1.0.0–v1.1.0`), and a deprecated-item badge count when deprecations are present.
- **Full-text search** (`body` field in search index): search now matches against item descriptions, `@param` descriptions, `@returns` descriptions, and `@throws` descriptions — not just symbol names and module labels. Matched results display a one-line body preview in the search panel. E.g. searching `"rate limit"` surfaces `RateLimitError`.
- **`{@link Symbol}` cross-references**: `resolveLinks()` in `renderer.js` replaces `{@link ClassName}` and `{@link ClassName#method}` tags in JSDoc descriptions with `<a class="link-ref">` anchor links pointing to the target card, within the same module page or across module pages.
- `.link-ref` and `.module-desc` CSS for the above.

### Changed
- `section()` signature extended with an optional `symbolMap` argument, threaded into every item renderer so `descHtml()` can resolve cross-references.
- `buildSearchIndex()` now calls `buildBody(item)` to populate `body` on each entry; client-side `search()` and `render()` functions updated to match and display body previews.
- `buildSite()` now builds a `symbolMap` ({`name → {anchorId, modulePath}`}) before rendering any page.

---

## [1.6.0] - 2026-06-29

### Added
- **Config file support** (`lib/config.js`): `.jsdoc-scribe.json` in the project root stores `out`, `title`, `theme`, `json`, `readme`, `ignore` (array of globs), and `sourceUrl`. CLI flags always override config values. Custom path via `--config` / `-c`.
- **Ignore patterns** (`--ignore <glob>` / `-I`, repeatable): glob-like patterns (supports `**/` prefix and `*` wildcard) exclude files and directories from collection. Also reads the `ignore` array from the config file.
- **Source links** (`--source-url <url>` / `-s`): each documentation card shows the file path and line number. When a GitHub base URL is provided (e.g. `https://github.com/user/repo/blob/main`), links point directly to the source line on GitHub.
- **Enterprise sample modules** in `sample/`: `errors.ts` (full AppError hierarchy with 7 classes and 3 helpers), `events.ts` (typed async EventBus with priority, once(), bridgeEvent), `middleware.ts` (composable Pipeline class + 5 built-in middleware: logger, responseTime, timeout, cors, errorToResponse), `container.ts` (DI Container with singleton/transient/scoped lifetimes + ConsoleLogger + MemoryCache + buildRootContainer).
- Line numbers extracted for every documented symbol (`node.getLineAndCharacterOfPosition()` in extractor.js).

### Changed
- `collectFiles()` accepts a fourth `ignorePatterns` array argument.
- `buildSite()` accepts `sourceUrl` in the options object.
- All item renderers (`renderFunction`, `renderClass`, etc.) accept `filePath` and `sourceUrl` for source link generation.

---

## [1.5.0] - 2026-06-29

### Added
- **JSDoc tag extraction**: `@param`, `@returns`, `@throws`, `@since`, `@deprecated` parsed from `/** */` blocks and attached to every extracted item. `@param` descriptions enrich the parameter table; `@throws` renders a dedicated table; `@deprecated` shows a warning notice + badge; `@since` shows a version label.
- **README auto-generator** (`--readme` / `-r`): writes `README.md` to the output directory summarising all exported symbols grouped by module with markdown tables.
- **Multiple themes** (`--theme <name>` / `-T`): three built-in themes — `default` (dark sidebar, light/dark toggle), `minimal` (clean light, no toggle), `dark` (forced dark, no toggle).
- Deprecated badge and warning notice rendered for `@deprecated` items throughout all section types.

---

## [1.4.0] - 2026-06-29

### Added
- **Programmatic API** (`require('jsdoc-scribe/docs')`): `lib/docs.js` exports `collectFiles`, `extractModule`, `extractModules`, `buildSite`, `generateSite`, `moduleLabel`, `moduleHtmlPath`, and constants. `package.json` `exports` field maps `./docs` subpath.
- **JSON export** (`--json` / `-j`): `gen-docs` writes `docs.json` with title, version, `generatedAt` ISO timestamp, and full modules array alongside the HTML site.
- **GitHub Actions workflow** (`.github/workflows/docs.yml`): triggers on push to `main`, builds docs, deploys to GitHub Pages via `actions/deploy-pages`.
- **Collapsible sidebar module tree**: when modules share a directory prefix, the sidebar groups them under expandable `<details>` elements. Active group auto-opens.

---

## [1.3.0] - 2026-06-29

### Added
- **JSDoc description extraction**: `lib/extractor.js` parses `/** */` blocks, extracts description (text before first `@tag`) and `@example` content, attaches to every extracted symbol.
- **Dark mode toggle**: CSS custom properties (`--bg`, `--surface`, etc.) for light/dark theming; `data-theme` attribute on `<html>`; `localStorage` persistence; "Dark/Light" toggle button in sidebar.
- **Collapsible class sections**: Constructor, Properties, Methods, Accessors rendered as `<details><summary>` elements — open by default.
- **Watch mode** (`--watch` / `-W`): `fs.watch({ recursive: true })` with 150ms debounce, no extra dependencies.

---

## [1.2.0] - 2026-06-29

### Added
- **Client-side search** (Ctrl+K): embedded JSON index searched as-you-type; results panel with module context.
- **Anchor deep-links**: every card gets a stable `id` and a `#` link for sharing.
- **Copy-signature button**: one-click clipboard copy for function/method signatures.
- Rich sample files: `sample/utils.js` (16 functions + constants), `sample/models.ts` (4 classes, 3 interfaces, 2 enums, 5 type aliases), `sample/api.ts` (4 classes, 4 interfaces, 3 functions).

---

## [1.1.0] - 2026-06-29

### Added
- **`gen-docs` CLI**: generates a multi-page HTML documentation site from JS/TS source.
- `lib/extractor.js`: TypeScript Compiler API AST → structured JSON module model.
- `lib/renderer.js`: JSON module model → multi-page HTML site.
- `bin/gen-docs.js`: CLI entry with `--out`, `--title`, `--help`, `--version` flags.

---

## [1.0.1] - 2026-06-29

### Fixed
- `@abstract` modifier never detected: `modifiersOf()` now uses `kinds.has(ts.SyntaxKind.AbstractKeyword)` (direct numeric comparison) instead of string reverse lookup which always returned `"FirstContextualKeyword"`.

---

## [1.0.0] - Initial release

### Added
- `gen-comments` CLI: AST-based JSDoc comment inserter for JavaScript and TypeScript. Adds `@param`, `@returns` (and `@class`, `@method`, etc.) stubs to undocumented functions and classes. Skip-existing and `--force` modes. Idempotent.
