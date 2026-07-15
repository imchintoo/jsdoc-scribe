# jsdoc-scribe

[![npm version](https://img.shields.io/npm/v/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![npm downloads](https://img.shields.io/npm/dm/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
<!-- [![Test](https://github.com/imchintoo/jsdoc-scribe/actions/workflows/test.yml/badge.svg)](https://github.com/imchintoo/jsdoc-scribe/actions/workflows/test.yml) -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/jsdoc-scribe.svg)](https://nodejs.org)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](./lib/index.d.ts)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen.svg)](https://imchintoo.github.io/jsdoc-scribe/)

> Automated, **AST-based** JSDoc comment generator and static documentation site builder for JavaScript & TypeScript. Fast, deterministic, and 100% local (No AI involved).
> **No AI. No LLM. No surprises.** Same input always produces the same output.

## Documentation

The official documentation site is available at **[imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/)**.

| Resource | Link |
|---|---|
| Website | [What is jsdoc-scribe?](https://imchintoo.github.io/jsdoc-scribe/) |
| Quick Start | [Install and generate your first docs](https://imchintoo.github.io/jsdoc-scribe/docs/quick-start.html) |
| CLI Usage | [Commands, checks, lint, and fix](https://imchintoo.github.io/jsdoc-scribe/docs/cli.html) |
| GitHub Pages | [Deploy generated docs](https://imchintoo.github.io/jsdoc-scribe/docs/github-pages.html) |
| API Reference | [Generated API docs](https://imchintoo.github.io/jsdoc-scribe/api/) |
| Blog | [Guides and release notes](https://imchintoo.github.io/jsdoc-scribe/blog/) |

Two CLIs, one dependency (`typescript` `>=5.0.0`, used purely as a syntax parser), **234
passing tests** (deterministic, zero network calls — same self-test suite runs on every
`npm test` and before every `npm publish`). `typescript` ships as a regular `dependency`,
not a `peerDependency`, because it parses every file this tool touches (`.js` included, not
just `.ts`) and can't be left for a consumer to optionally provide.

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source by reading the AST — no guessing |
| `gen-docs` | Builds a static, multi-page HTML documentation site from your documented source |

---

## Preview

![jsdoc-scribe docs preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview.svg)

Sticky topnav with centered search, white sidebar with an N-level folder tree, two-column symbol cards (prose left / dark code panel right), and a scroll-spy TOC on module pages.

### Code Health dashboard (`--quality`)

![jsdoc-scribe Code Health dashboard preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview-quality.svg)

With `--quality`, the index page becomes a Code Health dashboard — health score,
maintainability, complexity, duplicate-code, and orphan-file stats, each linking to a full
detail page — and every module page gets a compact per-file health strip. Full breakdown:
[Features](https://imchintoo.github.io/jsdoc-scribe/docs/features.html).

---

## Real-world sample code

`sample/` is a real, runnable-shaped fixture set — not toy one-liners — covering the stacks
teams actually ship with:

| Path | Stack | What's in it |
|---|---|---|
| `sample/express/` | Express.js (TS) | `app.ts`, routes, a controller, a service, and auth middleware for a small task API |
| `sample/nestjs/` | NestJS (TS, decorators) | A `UsersModule` with `@Controller`/`@Injectable` classes, a DTO using `class-validator` decorators, an entity, and a guard |
| `sample/vanilla-js/` | Plain JavaScript (CommonJS, no types) | A logger, an event emitter, a retry/circuit-breaker helper, and input validators |
| `sample/*.ts` (top-level) | Generic TS | A fully-documented DI container, error hierarchy, event bus, HTTP middleware, models, and API layer — used as the "already good" reference case for `--check-drift`/`--lint` |

Run any of the CLIs directly against them to see real output on real code, not a demo script:

```bash
gen-comments sample/nestjs --dry-run   # see what would be generated for decorator-heavy NestJS classes
gen-comments sample/express --check    # coverage on an undocumented Express app
gen-docs sample --out docs --title "jsdoc-scribe sample"
```

---

## Benchmarks

Measured directly against the CLIs, single Node process, no caching between runs.

| Source size | `gen-comments --dry-run` | `gen-docs` (single file) |
|---|---|---|
| 231 LOC | 1.15s · 96 MB | 0.49s · 94 MB |
| 23K LOC | 1.47s · 167 MB | 0.71s · 155 MB |
| 233K LOC | 4.17s · 345 MB | 2.29s · 445 MB |

Both CLIs scale close to linearly with source size. A real 1,000-file/70K-LOC project
finishes `gen-comments --write` in **1.03s at 115 MB**. `gen-docs`'s multi-file scaling
had a superlinear ceiling past ~300-500 files, fixed in v2.4.2 (400→1,000 files is now
~5.2x time for 2.5x files, down from an unbounded curve) — enforced continuously by
`npm run bench:perf-gate` in CI. Full numbers and root cause: [CHANGELOG](./CHANGELOG.md);
residual memory-footprint notes at very large file counts: [Known limitations](#known-limitations).

---

## Install

```bash
npx jsdoc-scribe . --write            # run once, no install
npm install --save-dev jsdoc-scribe   # add to project
npm install -g jsdoc-scribe           # or install globally
```

---

## Three ways to use jsdoc-scribe

Comments, docs, and lint are all reachable from the CLI, from inside your own Node code, or
wired into CI — pick whichever fits the moment. Everything below is expanded in its own
section further down; this is the map.

| | Comments (`gen-comments`) | Docs (`gen-docs`) | Lint (`--lint`) |
|---|---|---|---|
| **CLI** | `gen-comments src --write` | `gen-docs src --out docs` | `gen-comments src --lint` / `--lint --fix` |
| **Inside your codebase** | `require('jsdoc-scribe').processFile(file, { write: true })` | `require('jsdoc-scribe/docs').generateSite(['src'], opts)` | `require('jsdoc-scribe/lint').lintModule(moduleData)` |
| **GitHub Actions** | `run: npx gen-comments src --check` (PR gate) | `run: npx gen-docs src --out _site` (Pages deploy) | `run: npx gen-comments src --lint` (PR gate) |

### 1. CLI

```bash
gen-comments src --write          # insert missing JSDoc blocks in place
gen-comments src --check          # CI gate: fail if anything is undocumented
gen-comments src --check-drift    # CI gate: fail if JSDoc has drifted from the AST
gen-comments src --lint --fix     # validate JSDoc content, autofix what's safe to fix
gen-docs src --out docs --quality # build the docs site (add --quality for the Code Health dashboard)
```

Full flag references and walkthroughs live on the docs site:
[Quick Start](https://imchintoo.github.io/jsdoc-scribe/docs/quick-start.html) ·
[CLI Usage](https://imchintoo.github.io/jsdoc-scribe/docs/cli.html) ·
[Features](https://imchintoo.github.io/jsdoc-scribe/docs/features.html).

### 2. Inside your codebase

Every CLI capability is also a plain function import — no child-process spawning, no
parsing your own stdout. Three subpath exports, one per capability, all with hand-written
TypeScript declarations (no `@types/jsdoc-scribe` needed):

```js
const { processFile, analyseFile, collectFiles } = require('jsdoc-scribe');       // comments
const { generateSite, extractModule } = require('jsdoc-scribe/docs');             // docs
const { lintModule } = require('jsdoc-scribe/lint');                              // lint
```

Full walkthrough with real return shapes:
[Programmatic API](https://imchintoo.github.io/jsdoc-scribe/docs/programmatic-api.html).

### 3. GitHub Actions

Every CLI flag is a plain process exit code (`0`/`1`), so any of them drop straight into a
`run:` step. Copy-pasteable workflows (a PR quality gate covering comments + drift + lint,
plus a docs-to-Pages deploy) are documented in
[GitHub Actions Integration](https://imchintoo.github.io/jsdoc-scribe/docs/github-actions.html)
and [GitHub Pages Deployment](https://imchintoo.github.io/jsdoc-scribe/docs/github-pages.html) —
this repo's own [`test.yml`](./.github/workflows/test.yml), [`docs.yml`](./.github/workflows/docs.yml),
and [`publish.yml`](./.github/workflows/publish.yml) (npm OIDC trusted publishing, no stored
token) are the same workflows running live.

---

## Highlights

- **JSDoc linting without ESLint.** `gen-comments --lint` runs the same category of checks
  [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)'s `recommended` config
  does — missing tags, bad ordering, blank descriptions — with zero new dependencies.
  `--lint --fix` rewrites what's mechanically safe to fix (tag order, stray asterisks,
  placeholder `TODO:` descriptions) and never touches what it can't safely resolve (a
  missing block entirely, or a typo'd tag name).
- **Already on ESLint?** The same rules ship as a native flat-config plugin —
  [`packages/eslint-plugin-jsdoc-scribe`](./packages/eslint-plugin-jsdoc-scribe/README.md) —
  so findings and fixes show up in your existing `eslint`/`eslint --fix` run instead of a
  separate CLI invocation.
- **Optional code-quality dashboard.** `gen-docs --quality` can run
  [code-multivitals](https://www.npmjs.com/package/code-multivitals) (complexity,
  maintainability, duplicate-code, orphan-file detection) against the same files it
  documents. It's an optional `peerDependency` — never installed by default, and `gen-docs`
  behaves identically whether it's present or not.
- **Architecture Insight page.** Every `gen-docs` run now includes an Architecture page:
  a plain-English read of your folder structure, detected framework/stack (React, Express,
  NestJS, etc.), and architecture-pattern signals (CLI tool, publishable library, monorepo,
  layered/MVC layout) — each shown with the actual evidence, never a bare guess. No new
  flag, no AI, generated automatically alongside the rest of the site. Details:
  [Architecture Insight](https://imchintoo.github.io/jsdoc-scribe/docs/architecture-insight.html).
- **Config file support.** `.jsdoc-scribe.json` for `gen-docs` output dir, title, source
  URL, and ignore globs — CLI flags override it. Full reference: [Features](https://imchintoo.github.io/jsdoc-scribe/docs/features.html).

---

## Contributing

Bug reports and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for dev setup and
guidelines (determinism is non-negotiable, no new runtime dependency without discussion
first). This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). Found a security
issue? See [SECURITY.md](./SECURITY.md) rather than opening a public issue with exploit
details.

---

## Known limitations

- Inline anonymous callbacks (`arr.map(x => x * 2)`) aren't documented — named declarations only.
- Type inference is 100% syntactic — no evaluation, no imports, no type-checking.
- Multi-declarator statements (`const a = 1, b = 2;`) get one combined block.
- `.d.ts` files are skipped.
- `gen-docs` doesn't serve — use `npx serve docs` or deploy statically.
- `gen-docs`'s per-page superlinear scaling past ~300-500 files (unmemoized sidebar path-prefix recomputation) is fixed as of v2.4.2 — see [Benchmarks](#benchmarks) and the CHANGELOG. The parse phase (TS Compiler API per file) was profiled and confirmed *not* co-dominant at the file counts tested, so it stays single-threaded (`worker_threads` explicitly out of scope for this fix — see `docs/backlog/adr-linear-scaling-fix.md`).
- `gen-docs` holds every generated page's full HTML (including its own embedded sidebar markup) in memory until the whole site has been built, then writes it all to disk — at very large file counts (order of thousands) this is a memory-footprint concern independent of the scaling fix above. Not yet sized against real hardware; tracked in `docs/backlog/task-ls-04-sidebar-node-caching.md`'s implementation notes.

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## License

MIT © [Chintan](https://github.com/imchintoo)
