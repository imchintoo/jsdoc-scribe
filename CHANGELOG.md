# Changelog

All notable changes to `jsdoc-scribe` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
