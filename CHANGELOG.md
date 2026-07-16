> **Note:** the entries for `2.4.1` and `2.4.3`–`2.4.7` below were reconstructed
> from the repository's real git history on 2026-07-15, closing a gap where
> these versions had shipped without changelog entries. Each entry is
> grounded in the actual commit diffs for that version (see the referenced
> commit messages/backlog docs) — nothing here is invented.

## [Unreleased]

### Added
- **Architecture Insight page.** `gen-docs` now builds an "Architecture" page inside the generated site, read directly off the target project's `package.json` and folder layout (no AI, nothing guessed — every line shows its own evidence):
  - **Architecture-pattern signals** (`lib/project-facts.js`, `getArchitecturePatterns`) — 23 patterns detected (CLI tool, publishable library, monorepo, Layered, MVC, Hexagonal, Onion, Repository, Vertical Slice, Feature-Based, Modular Monolith, Monolith, Serverless, and more), each returned with the concrete evidence that triggered it (a `bin` entry, an `exports` field, an npm `workspaces` list, matching directory names) rather than a single confident label — real projects usually match more than one pattern at once.
  - **Framework/stack detection** — React, Next.js, Angular, Vue, Express, and NestJS detected from dependencies, each marked as a dependency match or a lower-confidence file-pattern guess.
  - **Folder structure map** — a collapsible directory tree with a plain-English file-count summary per directory, plus workspace package listing for monorepos.
  - Wired through `bin/gen-docs.js` (`getAllFacts(process.cwd())`, computed once per live run) and the programmatic API (`lib/docs.js`'s `generateSite()` via an opt-in `rootDir` option — omitted `rootDir` keeps prior behavior unchanged, no Architecture page).
  - Per ADR Decision 6: facts are never computed or shown on a historical `site-versions/` snapshot render, only on the live/current-`docs/` output.
  - The page (and its sidebar link) is omitted entirely when a project has zero detectable signals, rather than rendering empty.
  - Docs: new [Architecture Insight](https://imchintoo.github.io/jsdoc-scribe/docs/architecture-insight.html) page; README feature list updated.

### Fixed
- **Module pages missing `.index-content` layout wrapper.** The Architecture Insight work (above) introduced `.index-content` as the shared padding/width wrapper for the index and Architecture pages, but per-module pages were never updated to use it — leaving module pages visually inconsistent (missing the same side padding and max-width as every other page). `buildSite()` in `lib/renderer.js` now wraps each module page's body in `<div class="index-content">` to match.

## [2.4.7] - 2026-07-13

### Fixed
- **Docs site markdown rendering: list/bold/link gaps unified.** `scripts/build-pages-docs.js`'s markdown parser previously had no block type for `-`/`*`/numbered lists (list lines fell through and rendered as plain paragraph text), and blockquotes/paragraphs ran through inconsistent inline-formatting passes. `parsePostBlocks()` now recognizes ordered/unordered list items as their own block type (rendered as real `<ul>`/`<ol>`), and every text-bearing block (paragraph, quote, list item) now runs through the same `inlineMarkdown()` pass, so bold text and links render consistently everywhere instead of only in paragraphs.
- A layout/design issue on the generated GitHub Pages site was corrected (`scripts/build-pages-docs.js`).

### Added
- New blog post: "Halving Engineering Overhead: Documentation Automation" (`docs-site/posts/`), with its own preview image (`assets/halving-engineering-overhead-documentation-automation.png`).

### Changed
- `README.md` substantially trimmed (503 → ~100 net lines) now that the full walkthrough content lives on the GitHub Pages documentation site instead of duplicated in the README.

## [2.4.6] - 2026-07-12

### Changed
- Expanded and corrected the GitHub Pages documentation content across every doc page (quick-start, CLI, GitHub Actions, GitHub Pages, programmatic API, ESLint plugin, features) and the corresponding rendering in `scripts/build-pages-docs.js`.
- `README.md` updated to match the expanded docs site.

## [2.4.5] - 2026-07-10

### Added
- **GitHub Pages documentation site.** `scripts/build-pages-docs.js` builds a full static site from markdown sources: `docs-site/docs/` (quick-start, CLI, GitHub Actions, GitHub Pages, programmatic API, ESLint plugin, features, and this changelog page — which renders directly from `CHANGELOG.md`, not a separately hand-maintained copy) and `docs-site/posts/` (blog). New `npm run docs:pages` script. Ships with two launch posts: "Publish your jsdoc site with GitHub Pages" and "Why deterministic JSDoc matters."

### Fixed
- **CI publish reliability**: pinned `npm` to `11.5.1` in the publish workflow (`.github/workflows/publish.yml`) — a floating `npm install -g npm@latest` had picked up a release whose bundled `libnpmpublish` required the unscoped `sigstore` package while that npm release's own `package.json` only shipped the newer scoped `@sigstore/*` packages, breaking `npm publish` with `Cannot find module 'sigstore'`.
- Perf-gate threshold raised from 4.5x to 5.0x (`bench/run-perf-gate.js`) after a CI run measured 4.55x on functionally unchanged code — shared CI-runner timing noise, not a regression. Still tight enough to catch a genuine superlinear blowup.

### Changed
- CI: `docs.yml`/`perf-gate.yml`/`quality.yml` workflows' Node version bumped 20 → 24; `test.yml`'s test matrix updated from `[18, 20, 22]` to `[22, 24, 26]`.

## [2.4.4] - 2026-07-09

### Changed
- CI: `publish.yml` workflow's Node version bumped 20 → 24.

## [2.4.3] - 2026-07-09

### Fixed
- **TypeScript 7 silent-failure bug** (`docs/backlog/task-ts7-01.md`–`task-ts7-04.md`, reported against a real user repo). A file that failed to parse inside `extractModule()` was logged (`  <file> -> FAILED: <message>`) but otherwise treated as a no-op — `--check-drift`, `--lint`, `--fix`, `--check`, `--dry-run`, and plain `--write` runs all still exited `0` and could print a false "all clean" message (`"No drift detected..."`, `"No lint issues found."`, `"All symbols are documented."`) even when one or more files had silently failed to parse. `bin/cli.js` now tracks a per-run `failedTotal` across all six of those code paths: a parse failure now forces a non-zero exit code and prints an explicit `N file(s) failed to parse.` line, and the success messages are replaced with an honest "found no issues among the files that did parse, but N failed" variant when applicable.
- `typescript` dependency range pinned to `>=5.0.0 <7.0.0` (`package.json`) — an untested major-version bump of the parser this tool is built on was the root cause a user could hit silently, per the above.
- `.github/ISSUE_TEMPLATE/bug_report.md`: fixed a broken version-check command in the template.

### Tests
- New `test/cli-failure-accounting.test.js`, wired into `test/run.js`: asserts the failure-accounting behavior above across all six CLI modes, on all-healthy, mixed healthy/broken, and 100%-broken input sets.

## [2.4.2] - 2026-07-08

### Fixed
- **`gen-docs` superlinear scaling past ~300-500 source files** (`docs/backlog/story-gendocs-linear-scaling.md`, `docs/backlog/adr-linear-scaling-fix.md`). Root cause, confirmed via `node --prof` (not just a code read): `commonRoot(modules)` in `lib/renderer.js` re-walked every module's split file path on every call, reached through `moduleLabel`/`moduleHtmlPath` once per sidebar-tree leaf inside `renderTreeLevel`, itself invoked once per generated page (`buildSidebar()`) -- an O(N&sup3;) path overall, not the trie-building step (already fixed in an earlier sprint). Two changes, both additive/targeted (no restructuring of surrounding logic):
  - `commonRoot()` is now memoized in a `WeakMap` keyed on the `modules` **array reference** (deliberately not a filePath string, to avoid two independent `buildSite()` calls bleeding a cached label into each other -- see the ADR's Alternatives).
  - The sidebar's per-page render now precomputes each tree node's default (closed, non-active) HTML **once per `buildSite()` call** and reuses it for every page; only the active ancestor chain + active leaf are rendered fresh per page (was: the entire tree, every page). The redundant per-page `__parent`-linking walk was also folded into this one-time pass (same call chain, not called out separately in the original ticket list, disclosed in `docs/backlog/task-ls-04-sidebar-node-caching.md`'s implementation notes).
  - `worker_threads` parallelization of the parse phase was evaluated and explicitly **not** pursued -- profiling at N=300 showed TS Compiler API parse functions at 0.0%-0.1% of JS ticks, nowhere near co-dominant with the render-phase bottleneck above.

### Added
- `bench/generate-fixtures.js` + `bench/run-perf-gate.js` (`npm run bench:perf-gate`): a deterministic (seeded-PRNG) synthetic-fixture generator and a perf-gate script asserting `time(2000 files) / time(500 files) < 4.5x`. `.github/workflows/perf-gate.yml`: runs the gate on every push/PR to `main`.
- `test/renderer-memoization.test.js`: dedicated cross-call cache-isolation regression suite for the two caches above (two `buildSite()` calls sharing a filePath string but a different common root must not bleed a label/href between them).
- `test/gen-docs.test.js`: a permanent full-output-tree byte-diff regression test (every generated file, not a `modules/`-only spot check, both with and without `--quality`) -- extends the existing byte-diff pattern from a one-time verification into an automated guard against future `renderer.js` regressions.

### Performance
- Wall-clock, synthetic multi-directory fixtures, `gen-docs` end to end (single machine, informal numbers -- see README Benchmarks for the full table and the CI gate for the authoritative, continuously-re-measured check): 400 files went from **28.38s pre-fix to 0.90s post-fix**; 500 files did not reliably complete pre-fix within a reasonable window and now completes in **2.40s**; 1,000 files in **4.68s**. See `docs/backlog/task-ls-02-profiling-spike.md` for the full profiling data and `docs/backlog/task-ls-04-sidebar-node-caching.md` for the post-fix numbers.

### Disclosed trade-offs / known follow-ups
- A pre-existing, unrelated memory-footprint characteristic surfaced during verification: `buildSite()` holds every generated page's full HTML (including each page's own embedded sidebar markup) in memory until the whole site is built. This is not something this fix introduced or worsened, but it means very large sites (order of thousands of files) may hit memory limits on constrained hardware independent of the wall-clock fix above -- not yet sized against realistic CI hardware, tracked as an open follow-up rather than silently declared fine. See README's Known limitations.
- The 2,000-file point of the perf-gate's own threshold check was not hand-verified in this development environment (memory-constrained sandbox, see above) -- the CI gate (`.github/workflows/perf-gate.yml`) re-measures it on every push/PR going forward, which is the authoritative, continuously-current source rather than a single frozen number in this changelog.

### Tests
- Test suite grew from 228 to 234 assertions (2 new full-tree byte-diff tests in `test/gen-docs.test.js`, 3 new cross-call isolation tests in the new `test/renderer-memoization.test.js`). All pre-existing 228 assertions pass unchanged -- verified via byte-diff against `sample/`, both with and without `--quality`, confirming zero output/behavior change (story AC7).

## [2.4.1] - 2026-07-07

Version-only republish — `package.json`/`package-lock.json` version bump with
no functional code change against `2.4.0`.

## [2.4.0] - 2026-07-07

### Added
- **Doc-site version switcher** (`docs/backlog/story-doc-version-switcher.md`): every generated page (index, module pages, health-detail pages) now carries a "Current" control in the topnav. With history >=2 generations, it's a native `<details>/<summary>` dropdown listing "Current" plus every preserved prior generation, most-recent-first, each linking to a **complete, self-contained rendering of the site as it looked at that generation** -- not a changelog/diff summary. With no history yet, it renders as a plain, non-interactive `Current` label instead of a broken empty dropdown. Zero client-side JS -- the control is native HTML disclosure, degrades to plain navigable links with JS disabled.
- `--data` now also backfills `<out>/site-versions/<version-id>/` -- a full rendered snapshot for every `site-data-history/*.json` entry that doesn't have one yet ("render-only-missing": an already-rendered, immutable snapshot is never re-rendered, keeping per-run cost O(1) regardless of history depth after a one-time backfill). `<version-id>` is the same ISO-timestamp `site-data.js` already uses for history filenames, so the two stay trivially correlated.
- **Per-function/method Code Health drill-down** (`docs/backlog/story-function-level-health-drilldown.md`): function and class-member (constructor/method/getter/setter) entries on module pages now show their own grade/score chip and metric dots, sourced from code-multivitals's `FileReport.functions[]`, matched by name + tightest-containing-range (our AST extraction only has a start line; code-multivitals's `startLine`/`endLine` range is used as the match target). Falls back to a muted "no data" chip -- never a stale file-level number repeated per function -- when no match is found.
- **Corrected design tokens** (`docs/backlog/adr-phase-n-exact-design-tokens.md`): the two newly-uploaded mockups (`Code Health Report.html`, `File Detail Report.html`) shipped literal, recoverable design tokens this time (unlike Phase M's reconstruction). `--coral` corrected from `#FF6452` to its real `#FF4B2E`; full corrected radius/shadow/type-scale token set; `Space Grotesk`/`JetBrains Mono` now loaded via Google Fonts CDN `@import` (Chintan's explicit choice over self-hosting) -- the first generated-output dependency on a third-party network resource, documented as a precedent-setting exception to this project's usual zero-external-dependency posture.

### Fixed
- Caught during this batch's own live verification, not by a written test in advance: a version-switcher snapshot's own switcher menu failed to mark itself as the current selection on first render, because the version list passed to a backfill pass was computed from already-existing `site-versions/` directories rather than from all `site-data-history/*.json` entries. Fixed before this shipped; every snapshot's own page now correctly self-identifies (`is-current`/`aria-current="page"`).

### Disclosed trade-offs
- An older version-switcher snapshot does not link forward to snapshots rendered after it (a reader must go via "Current" first, one extra hop) -- the direct, necessary consequence of render-only-missing's cost guarantee (re-patching every prior snapshot on every run would reopen the unbounded-cost problem this design avoided). Accepted at product-owner acceptance.
- The live/current generation's own `site-versions/` snapshot is deliberately never pre-rendered (a documented deviation from the original architect spec) -- `site-data.js`'s history-eviction timestamp can't be predicted before the eviction actually happens, so only already-evicted, stably-named history entries are ever backfilled.

### Tests
- Test suite grew from 222 to 228 assertions: 6 new tests in `test/gen-docs.test.js` cover the version switcher's full lifecycle -- fresh-repo static-span shape, 3 successive generations with genuinely differing content producing correctly-ordered history, render-only-missing immutability (mtime + byte-identical content across a later run), cross-page `aria-current` correctness (the test that caught the bug above), zero-JS degradation, and the `max-height:320px` CSS cap.
- Verified live against real, incrementally-modified fixtures across 3 successive `gen-docs --quality --data` runs: correct eviction/backfill sequencing, correct render-only-missing, correct most-recent-first ordering, and correct per-page `aria-current` on both the live index and every snapshot page.
- Default (no `--data`/`--quality`) `gen-docs` output confirmed byte-for-byte unaffected.

## [2.3.0] - 2026-07-07

### Changed
- **Exact-design shell** (`docs/backlog/adr-phase-m-exact-design-shell.md`): the doc site's chrome now matches `Code Health Redesign.dc.html`/`File Detail Redesign.dc.html` directly instead of reusing the prior light theme -- dark sidebar (`--sidebar-bg:#0E0E10`), offwhite content background (`--bg:#F5F4F0`), and the mockups' purple/lime/coral/gold accents. This is a site-wide chrome change (every page), not scoped to Code Health/File Detail alone.
- The project logo, version tag, and the Overview/Code Health nav buttons moved from the header into the sidebar (`.sidebar-brand`, `.navbtn`); the header now carries only a breadcrumb-style crumb and the search pill, matching both mockups. The `topnav-quality-link` class is renamed `sidebar-quality-link` at its new location.
- Sidebar symbol markers (`symRows()`) changed from colored text pills to a small colored dot + kind abbreviation, matching the mockup's member-row style; `sym-fn`/`sym-cls`/etc. class names are unchanged (now applied to the dot), so no new taxonomy was invented.
- Index hero gauge grows 120px -> 168px (the mockup's literal size); the focus-area cards' "view more" link is now a filled pill button using the card's own tag color (mockup's `focus-btn`), and `tag-chip` gets the mockup's 1.5px white outline.
- **Disclosed limitation**: both mockups `@import` a `hundi-design-system` token package that was not included in the upload (only referenced by path) -- exact hex values for most of the palette aren't literally recoverable. A few values ARE literal evidence in the mockups' own markup/JS and are used verbatim (`--lime:#C6FF3D` from the mockup's own `gradeHex`, `--offwhite:#F5F4F0` and `--accent:#5B4FE8` from hover/active rgba tints, the gold/todo-badge hex codes). The rest of the palette is reconstructed to be visually consistent with those anchors; see the ADR's "Finding" section for the full disclosure.

### Tests
- `test/renderer.test.js` was rebuilt after a second sandbox file-truncation incident (this one struck mid-edit and the git-HEAD recovery path turned out to predate the Code Health/File Detail redesigns entirely, since none of this project's work has ever been committed) -- rebuilt directly against the current `lib/renderer.js` rather than forward-patching a stale baseline. Full suite: 219 assertions passing across all suites (renderer/lint/fix/import-graph/project-facts/quality/site-data/gen-docs).
- New coverage: sidebar-brand/navbtn/sidebar-quality-link presence, header crumb content and the absence of `topnav-logo`, `sym-dot`/`sym-kind-abbr` markup (and the absence of legacy `sym-pill`), the dark palette tokens and gauge-size CSS selectors, and a `<script>`-tag count assertion (zero-new-JS still holds).
- Verified live against this repo's own `lib/`+`bin/`+plugin source via `npm run dashboard`: dark sidebar, breadcrumb header, 168px index gauge, and dot-based symbol markers all render correctly; default (`--quality`-less) output unaffected beyond chrome colors.

## [2.2.0] - 2026-07-08

### Added
- **Per-file Code Health hero** (`docs/backlog/story-file-detail-redesign.md`, `docs/backlog/adr-phase-l-file-detail-and-site-data.md`): module pages now show a circular grade/score gauge (reusing v2.1.0's `scoreToGrade()`/`qColor()` primitives, scoped to that one file) in place of the old flat `.qstrip` chip row, plus a factual one-line narrative built purely from real error/warning/clone counts (deliberately not stylized "encouraging" copy). Files with no code-multivitals entry keep the same graceful muted fallback as before.
- **TODO-placeholder badge**: any `TODO:`-prefixed description (function/param/returns text written by `--fix`, per `lib/fix.js`'s own literal templates) now renders with a small "todo" badge and muted italic text, in function/class descriptions, the params table's Description column, and the Returns line. Real authored text is unaffected -- this is presentation-only.
- **`lib/site-data.js` + `--data`/`--from-data`**: `--data` writes `<out>/site-data.json`, one JSON capturing everything `buildSite()` needs (modules + quality/import-graph/snapshot data). It never silently overwrites a prior generation -- the previous `site-data.json` is moved into `<out>/site-data-history/` first, so successive generations stay individually comparable. `--from-data <path>` builds the full site directly from a saved `site-data.json`, skipping source parsing and quality analysis entirely (a template/CSS-only iteration no longer re-parses the tree or re-runs code-multivitals). Fully additive: `--json`/`docs.json`'s existing shape and behavior are untouched.
- `site-data.json` / `site-data-history/` added to `.gitignore` (generated output, same category as `docs/`/`snapshots/`).

### Tests
- Test suite grew from 209 to 231 assertions: 2 new suites (`test/site-data.test.js`, `test/gen-docs.test.js` -- the latter is `bin/gen-docs.js`'s first-ever dedicated test file, spawning the real CLI same as `test/cli.test.js` does for `bin/cli.js`) plus renderer-level coverage for `isTodoText`/`descText`, the per-file hero's grade/narrative/fallback states, and CSS selector presence. Two pre-existing tests deliberately revised (documented inline, same category as prior sanctioned exceptions): the old flat health-strip field/fallback assertions now check the hero gauge's markup shape instead of the retired `.qstrip`/`qChip` output.
- Verified live against this repo's own `lib/`+`bin/`+plugin source: real per-file grades (e.g. `bin/cli.js` graded F), a real `--fix`-generated TODO description/param/returns rendering the todo badge (constructed fixture, since this repo's own source currently has none left to exercise), `--data` run twice preserving history correctly, and `--from-data` reproducing byte-identical `index.html`/module pages against the original run. Confirmed default (`--quality`/`--data`/`--from-data`-less) output remains deterministic with no new markup beyond the always-present (page-wide) CSS selectors.

## [2.1.0] - 2026-07-07

### Changed
- **Code Health dashboard redesign** (`docs/backlog/story-code-health-redesign.md`, `docs/backlog/adr-phase-k-code-health-redesign.md`): the embedded Code Health section's 7 flat stat cards are replaced by a hero panel -- a CSS `conic-gradient` gauge showing a letter grade + the existing health score (grade is a purely cosmetic finer scale layered on the existing `qColor` 3-color bands, not a second palette), the remaining 6 stats as a compact metrics list, and a trend sparkline + delta badge sourced from `--quality-trend <dir>` snapshot history (renders an honest "not enough scan history yet" message below 2 snapshots -- never a fabricated line).
- The 4 focus-area cards (files needing attention, duplicate code, most-imported files, orphan files) are restyled with a tag chip, colored top border, and a big headline stat; rows beyond the 5-row preview are reachable via a native `<details>`/`<summary>` inline expand -- zero new client-side JS (reuses the same disclosure pattern already used by the sidebar's directory tree). The standalone detail pages (`health-attention.html` etc.) are unchanged and still linked from every card.
- `--quality-trend <dir>` now also drives the embedded index-page sparkline when passed alongside plain `--quality` (previously only wired for the standalone `--quality-reporter dashboard` mode) -- no new CLI flag.
- Environment/hardware requirement badges (cores/RAM/disk/editor/browser) from the originally-proposed mockup were explicitly deferred, not built -- none of those values are derivable from repo state, and inventing them would contradict this project's "derived from actual repo state, never hand-typed prose" principle. See the ADR's Decision 7.

### Tests
- Test suite grew by 8 assertions: `scoreToGrade` boundary cases at every named grade, hero gauge/metrics rendering against real data, `buildHealthSparkline`'s 0/1/2+-snapshot branches (including correctly-signed delta direction), per-card `qcard-expand` presence/absence, a zero-`<script>` assertion scoped to `buildQualitySection()`'s own output, and new CSS selector coverage. One pre-existing test deliberately revised (documented inline, same category as the prior "5→9 pages" exception): the index card's inline expand now embeds overflow rows in the DOM (behind a native, collapsed `<details>`), so the assertion now checks that exactly 5 rows are visible *ahead of* the expand, rather than asserting overflow rows are entirely absent from `index.html`.
- Verified live against this repo's own `lib/`+`bin/`+plugin source: real avg health 64.1, grade D, 20 errors, 204 warnings (non-placeholder). Confirmed default (`--quality`-less) output is deterministic and contains zero occurrences of the new markup (`qhero`/`qcard2`/`code-health`). Confirmed the sparkline renders a real trend line from 2 saved snapshots via `--quality-snapshot`.

## [1.21.1] - 2026-07-06

### Changed
- **Code Health-only index under `--quality`** (same-day follow-up to v1.21.0, `docs/backlog/story-code-health-drilldown.md`): when `--quality` is passed, the index page's Modules grid is no longer rendered — the Code Health dashboard (7 stat cards + 4 summary cards) is the only content section on the page, instead of sitting alongside the module grid. Module navigation is unaffected: the full module tree remains in the sidebar on the index page (and every page) regardless of this flag. Plain `gen-docs` with no `--quality` is unaffected — the Modules grid renders exactly as before.
- `lib/renderer.js`'s `buildSite()`: the index body now conditionally skips `buildIndexBody(modules)` when `options.quality` is set — a one-line change, additive/conditional only, no other index-page markup touched.
- `README.md`: added a "Code Health dashboard (`--quality`)" preview (`assets/preview-quality.svg`) and rewrote the `### Quality reporting` description to reflect the card layout, the 4 detail pages, the per-module health strip, and that the dashboard replaces (not sits alongside) the Modules grid on the index page. Also corrected the stale "152 passing tests" figure to the current 201.

### Added
- `assets/preview-quality.svg`: new hand-crafted mockup (same style/size convention as `assets/preview.svg`) depicting the `--quality` index page — stat cards, the 4 summary cards with "View all →" links, no Modules grid.

### Tests
- Test suite grew from 195 to 201 assertions: 3 new tests cover (1) Modules grid removed from index body when `--quality` is active, (2) Modules grid still renders when `--quality` is absent (regression), and (3) sidebar module navigation is unaffected either way.

## [1.21.0] - 2026-07-06

### Added
- **Code Health card layout + drill-down detail pages** (fast-follow to v1.20.1's embedded section, `docs/backlog/story-code-health-drilldown.md`): the index page's 4 full inline tables (files needing attention, duplicate code, most-imported files, orphan files) are now compact summary cards (top 3-5 rows + a "View more" link), each linking to its own full, uncapped detail page at the output root: `health-attention.html`, `health-duplicates.html`, `health-imports.html`, `health-orphans.html`. The 7 stat cards above them are unchanged.
- **Per-module health strip**: every generated module page now shows a health-metrics strip (`<aside aria-label="Code health summary">`) directly below its header — Health Score, Maintainability, Functions, Errors, Warnings, Clone involvement, Worst severity, Code smells — so a reader lands on a file's health context without cross-referencing the index. Modules with no code-multivitals entry show a single muted "No code health data for this file." row instead of throwing or omitting the strip.
- Both are additive to the existing `--quality` flag — no new CLI flag, and default (`--quality`-less) `gen-docs` output is unaffected (verified: 0 occurrences of the new markup, 0 new files, when `--quality` isn't passed).

### Changed
- `lib/renderer.js`: `buildQualitySection()` now renders `qCard`-based summary cards instead of full inline tables; new `buildHealthDetailPages()`, `buildFileHealthLookup()`, and `buildHealthStrip()`. Per-file error/warning/function counts for the strip are derived from existing `FileReport.functions[].metrics[].severity` data (code-multivitals's `FileSummary` doesn't carry them directly) — no new metrics, no new dependency.
- Test suite grew from 187 to 195 assertions. One existing regression test's contract deliberately changed: `buildSite()` under `--quality` now returns 9 pages (5 base + 4 health detail pages), not the prior "still exactly 5" — documented inline in `test/renderer.test.js` as a sanctioned exception to the single-artifact principle, not a silent regression (the 4 new pages are extensions of the doc site's pre-existing multi-page nature, same category as the one-page-per-module pages that have always existed).

### Correction (caught during design review, before implementation)
- The initial architecture pass assumed the 4 new detail pages should live "in the same output directory as module pages." That's incorrect against the actual code — module pages live in a `modules/` subdirectory (`moduleHtmlPath()`), while `index.html` is written at the output root. Corrected before implementation: the 4 detail pages live at the output root, sibling to `index.html`, since they're extensions of the index page's Code Health section, not per-module content. See `docs/backlog/story-code-health-drilldown.md`.

## [1.20.1] - 2026-07-06

### Fixed
- **`gen-docs --quality` now embeds its findings directly into `index.html`** instead of writing (or, in the internal-only path, requiring) a separate file. Chintan's direct feedback after reviewing the generated `docs/index.html`: the code-multivitals statistics belonged in the same page as the API docs, not off in a second artifact. `--quality` with no `--quality-reporter` now computes the code-multivitals analysis + the import-graph/orphan-file findings and passes them into the normal doc-site build, which renders a new "Code Health" section (stat cards, files-needing-attention table, duplicate-code pairs, most-imported files, orphan files) on the index page, with a "Code Health" link in the top nav. `--quality-reporter <console|json|html|sarif|badge|dashboard>` is still available and unchanged for anyone who explicitly wants a standalone report file instead (CI/export use cases) — it still skips the doc-site build, same as before.
- **Retired `scripts/gen-dashboard.js`** (and the `npm run dashboard` / `npm run quality:dashboard` scripts) — the separate internal `docs/dashboard.html` + `docs/dashboard-quality.html` pair it produced is now redundant with the embedded section above. New `npm run docs:internal` script documents jsdoc-scribe's own `lib/`/`bin/`/plugin source with `--quality`, producing the same one-file result contributors get from any project. `npm run quality` now explicitly passes `--quality-reporter console` (previously the implicit default) so it keeps its old plain-console behavior now that the flag's un-reportered default means something different.

### Changed
- `lib/renderer.js`: `buildSite(modules, options)` accepts an optional `options.quality` (`{ result, graph, orphans }`); when present, `buildQualitySection()` renders the Code Health section on the index page only — module pages are unaffected, and no new page is added to the site (still exactly `3 assets + index.html + one page per module`, verified by the existing "5 pages total" regression test).
- `.gitignore`: added `docs-internal` (the new script's generated output, never committed — same treatment as `docs`).

## [1.20.0] - 2026-07-06

### Added
- **Project dashboard (internal, repo-only)**: `npm run dashboard` generates `docs/dashboard.html` (onboarding facts — Node version vs. CI-tested matrix, package manager, project structure, global dependencies, test tooling — plus a project-wide import graph and orphan-file report) and `docs/dashboard-quality.html` (embedded code-multivitals dashboard). New modules `lib/project-facts.js` and `lib/import-graph.js` (the latter does its own lightweight import/export extraction via the `typescript` compiler API — no new dependency, but see Correction below), new repo-only `scripts/gen-dashboard.js` (not part of the published package). See `docs/backlog/epic-project-dashboard.md` / `adr-phase-j-project-dashboard.md`.
- **Quality reporting for `gen-docs`** (`--quality`, `--quality-reporter`, `--quality-profile`, `--quality-config`, `--quality-baseline`/`--quality-save-baseline`, `--quality-snapshot`/`--quality-trend`): opt-in [code-multivitals](https://www.npmjs.com/package/code-multivitals) integration (cyclomatic/cognitive complexity, Halstead volume, maintainability index, health score, compound smells, duplicate-code detection, all 6 reporters, baseline/diff mode, snapshots/trends/hotspots). `code-multivitals` is an **optional peerDependency** (`peerDependenciesMeta.optional: true`) — never installed by `npm install jsdoc-scribe`, never affects default `gen-docs` behavior, and produces a clear install-instruction error (not a crash) if used without it installed. New shared module `lib/quality.js` (dynamic `require`, never a top-level import, so the optional-dependency contract holds).
- `code-multivitals` also added as this repo's **first-ever `devDependency`** (distinct from the peerDependency above), used by the internal dashboard. Committed `.code-multivitals.json` (the `default` threshold profile).
- New npm scripts: `dashboard`, `quality`, `quality:dashboard`.

### Correction (caught during implementation)
- The original design (`adr-phase-j-project-dashboard.md`, `story-code-health-dashboard.md`) assumed `lib/import-graph.js` could reuse `lib/extractor.js`'s existing per-file import/export data, the same way `lib/drift.js`/`lib/coverage.js` reuse `extractModule()`'s output. That data does not exist — `extractModule()` has never extracted imports/exports. `lib/import-graph.js` does its own lightweight extraction instead, using the `typescript` compiler API (the project's existing one runtime dependency) — zero new dependency, but genuinely new parsing, not zero-new-parsing as originally assumed. Corrected in the ADR/story rather than shipped against the false premise.

### Changed
- Test suite grew from 152 to 181 assertions (10 new import-graph tests, 12 new project-facts tests, 9 new quality-module tests — the last including a real clean-room "package not installed" repro via a child process, not just a cache-eviction approximation).
- `package.json`: `files`/`bin` unchanged (still only `bin/cli.js` and `bin/gen-docs.js`) — the new internal dashboard script lives in `scripts/`, outside the published `files` glob, on purpose (verified via `npm pack --dry-run`).

### Design note
- Two different, deliberately separate dependency relationships to `code-multivitals` in the same release: a `devDependency` (internal dashboard, always present in this repo) and an optional `peerDependency` (end-user `gen-docs --quality*`, never forced on anyone). Conflating the two — e.g. making it a plain runtime dependency so end users get it "for free" — was considered and rejected; see `adr-phase-j-project-dashboard.md` Decision 10 and its Alternatives Considered section.

## [1.19.0] - 2026-07-06

### Added
- **`--fix` flag for `gen-comments`**: rewrites *existing* JSDoc blocks in place to resolve `--lint` findings — reorders `@param` tags to match real parameter order, fills a missing `@param`/`@returns`/description with a fixed, deterministic `"TODO: ..."` placeholder (never invented prose), strips trailing text off a no-description tag, collapses stray asterisks, and drops an unnecessary `@returns` on a function that never returns a value. Implies `--lint`. Does **not** add JSDoc to undocumented symbols (that stays `--write`'s job) and never auto-fixes `check-tag-names` (an unknown/typo'd tag has no safe default — always left as a remaining issue for a human). New `lib/fix.js`, zero new npm dependency.
- **`eslint-plugin-jsdoc-scribe@0.2.0`**: 10 of the plugin's 12 rules now ship a real ESLint `fix()` (`fixable: "code"`), using the same rebuild strategy and `TODO:` placeholder convention as the core CLI's `--fix`. `require-jsdoc` and `check-tag-names` remain fixer-less, for the same reasons as the core CLI.

### Changed
- Internal: `lib/extractor.js`'s `readJSDoc()` now also returns `commentRange` (`{ pos, end }`, the exact source-text range of an existing JSDoc block) per symbol — purely additive, same threading pattern as `rawComment`/`badComment` in v1.18.0. Verified zero behavior change: all 132 pre-existing tests pass unmodified.
- Test suite grew from 132 to 152 assertions in the core package (20 new: 16 `lib/fix.js` unit tests, 4 CLI-level `--fix` tests) and from 36 to 39 in `eslint-plugin-jsdoc-scribe` (3 new `Linter.verifyAndFix()` convergence/preservation tests, alongside 10 new `RuleTester` `output` assertions on already-existing cases).

### Design note
- Filling in a missing description with a placeholder is a deliberate, narrow exception to "no AI, no guessing" — every placeholder is a fixed template (`"TODO: describe ...”`), never code-derived prose, and is unmistakably marked so a human immediately knows it needs attention (`grep -r "TODO: describe"` finds every one). See `docs/backlog/adr-013-lint-autofix.md` for the full reasoning, including why `check-tag-names` is the one rule that stays report-only even here.

## [1.18.0] - 2026-07-06

### Added
- **`--lint` flag for `gen-comments`**: native JSDoc content validation — no ESLint required. New `lib/lint.js` rule engine reuses `extractModule()`'s existing AST + parsed-JSDoc data (plus a new additive `rawComment`/`badComment` field per symbol) to check the same category of things `eslint-plugin-jsdoc`'s `recommended` config does: `require-jsdoc`, `require-param`/`require-param-description`, `check-param-names` (ordering), `require-returns`/`require-returns-description`/`require-returns-check`, `require-description`, `check-tag-names`, `empty-tags`, `no-multi-asterisks`, `no-blank-block-descriptions`, `no-bad-blocks`. Read-only, exits 1 if issues are found — same CI-gate contract as `--check`/`--check-drift`. Zero new npm dependency.
- `--lint` and `--check-drift` can be passed together in one invocation; both share a single `extractModule()` parse per file rather than parsing twice.

### Changed
- Internal: `lib/extractor.js`'s `readJSDoc()` now also returns `rawComment` (the exact `/** */` block text) and `badComment` (a near-miss malformed block, e.g. wrong asterisk count) per symbol, threaded through every extractor function/class/method/constructor/getter/setter/property/interface/typeAlias/enum/variable output. Purely additive — verified zero output change on every existing field via a byte-diff dogfood run across `lib/` and `bin/` (same method as `task-a10-03`), excluding the two new fields.
- Test suite grew from 101 to 132 assertions (31 new: `lib/lint.js` unit tests plus `--lint` CLI-level tests).

### Known limitation (tracked, not a regression)
- `extractModule()`'s traversal (existing behavior, inherited by `--lint`) walks into function bodies and picks up local variable declarations as documentable "symbols," not just top-level/exported declarations — the same reason `--check` has always reported jsdoc-scribe's own low internal-helper coverage number. `--lint`'s `require-jsdoc` inherits that same scope, so running `--lint` against this repository's own `lib/` reports real (not false-positive) gaps on internal helpers that were never intended to carry a doc block, consistent with what `--check` already reports today. Scoping extraction to declaration depth or exported-only symbols is a larger, separate change candidate for a future story — not bundled into this release.

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
- **GitHub Actions workflow** (`.github/workflows