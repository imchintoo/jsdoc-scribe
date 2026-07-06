# jsdoc-scribe

[![npm version](https://img.shields.io/npm/v/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![npm downloads](https://img.shields.io/npm/dm/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![Test](https://github.com/imchintoo/jsdoc-scribe/actions/workflows/test.yml/badge.svg)](https://github.com/imchintoo/jsdoc-scribe/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/jsdoc-scribe.svg)](https://nodejs.org)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](./lib/index.d.ts)

> Automated, **AST-based** JSDoc comment generator and static documentation site builder for JavaScript & TypeScript. Fast, deterministic, and 100% local (No AI involved).
> **No AI. No LLM. No surprises.** Same input always produces the same output.


Two CLIs, one dependency (`typescript`, used purely as a syntax parser), **152 passing tests** (deterministic, zero network calls — same self-test suite runs on every `npm test` and before every `npm publish`):

`typescript` is listed as a regular `dependency`, not a `peerDependency`, on purpose: it's the
parser for *every* file this tool touches, `.js` included, not just `.ts` — so it can't be
left for a consumer to optionally provide. The version range (`>=5.0.0`) is deliberately
permissive so it resolves to whatever TS version a consuming project already has, without
requiring one to be present at all.

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source by reading the AST — no guessing |
| `gen-docs` | Builds a static, multi-page HTML documentation site from your documented source |

---

## Preview

![jsdoc-scribe docs preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview.svg)

Sticky topnav with centered search, white sidebar with an N-level folder tree, two-column symbol cards (prose left / dark code panel right), and a scroll-spy TOC on module pages.

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
| 2.3K LOC | 0.66s · 108 MB | 0.39s · 104 MB |
| 23K LOC | 1.47s · 167 MB | 0.71s · 155 MB |
| 117K LOC | 2.50s · 311 MB | 1.39s · 269 MB |
| 233K LOC | 4.17s · 345 MB | 2.29s · 445 MB |

Real multi-file project (1,000 files, 70K total LOC): `gen-comments --write` finishes in **1.03s at 115 MB**. Both CLIs scale close to linearly with source size — the ~300-500ms floor at small sizes is Node + TypeScript-parser startup, not per-line work.

One known ceiling: `gen-docs` site generation slows superlinearly past ~300-500 source files (traced to redundant path-prefix recomputation in the sidebar/label logic) — tracked for a fix, see [Known limitations](#known-limitations).

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

The two binaries this package installs — `gen-comments` and `gen-docs` — cover writing
JSDoc, validating it, and building a docs site, with no config file required to get
started:

```bash
gen-comments src --write          # insert missing JSDoc blocks in place
gen-comments src --check          # CI gate: fail if anything is undocumented
gen-comments src --check-drift    # CI gate: fail if JSDoc has drifted from the AST
gen-comments src --lint           # CI gate: fail if JSDoc content itself is invalid
gen-comments src --lint --fix     # rewrite existing JSDoc to resolve lint findings
gen-docs src --out docs --title "My Project"
```

Full flag references: [`gen-comments`](#gen-comments--add-jsdoc-to-source),
[`--lint`](#--lint--jsdoc-validation-no-eslint-required),
[`--fix`](#--fix--autofix-lint-issues),
[`gen-docs`](#gen-docs--build-a-documentation-site).

### 2. Inside your codebase

Every CLI capability is also a plain function import — no child-process spawning, no
parsing your own stdout. Three subpath exports, one per capability:

```js
const { processFile, analyseFile, collectFiles } = require('jsdoc-scribe');       // comments
const { generateSite, extractModule } = require('jsdoc-scribe/docs');             // docs
const { lintModule } = require('jsdoc-scribe/lint');                              // lint
```

Full walkthrough with real return shapes: [Programmatic API](#programmatic-api).

### 3. GitHub Actions

Drop any of the three CLI commands above into a `run:` step — they're plain CLI exit
codes (`0`/`1`), so they compose with any workflow you already have. Full copy-pasteable
workflows (PR quality gate covering comments + drift + lint, plus a docs-to-Pages deploy)
are in [CI — GitHub Actions](#ci--github-actions) below.

Already running ESLint? The same 12 lint rules — 10 of them autofixable — are also
available as a native ESLint flat-config plugin — see
[`packages/eslint-plugin-jsdoc-scribe`](./packages/eslint-plugin-jsdoc-scribe/README.md)
if you'd rather your JSDoc findings (and fixes) show up in your existing `eslint`/`eslint --fix`
run than a separate CLI invocation.

---

## `gen-comments` — add JSDoc to source

```bash
gen-comments <path> [path2 ...] [options]
```

`<path>` can be a file or directory (scanned recursively; `node_modules`, `dist`, `build`, `.git`, dotfolders auto-skipped). Idempotent — a second run adds zero blocks. Nodes with an existing `/** */` block are left untouched unless `--force`.

```ts
// before
export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user) throw new AuthError("Invalid credentials");
    return user;
}

// after: gen-comments src/auth.ts --write
/**
 * @async
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User>}
 */
export async function login(username: string, password: string): Promise<User> {
    const user = await db.findByUsername(username);
    if (!user) throw new AuthError("Invalid credentials");
    return user;
}
```

Purely syntactic — explicit type annotations are used verbatim; without them, the tool infers from literal shape (`'x'` → `string`) and scans for a top-level `return <value>` statement. No type-checking, no evaluation.

### Flags

| Flag | Short | Description |
|---|---|---|
| `--write` | `-w` | Edit files in place (otherwise writes a sibling `<name>.out.<ext>` for review). |
| `--force` | `-f` | Re-insert blocks even where one already exists. |
| `--dry-run` | `-n` | Preview only, no writes. |
| `--check` | `-C` | Like `--dry-run`, exits `1` if anything's undocumented. CI coverage gate. |
| `--check-drift` | | Compares existing JSDoc against the current AST — flags missing/removed params and return-type mismatches. Read-only, exits `1` on drift. |
| `--lint` | | Validates JSDoc content — missing tags, unknown tag names, blank descriptions, comment formatting. Read-only, exits `1` on findings. |
| `--coverage-badge <dir>` | | Writes an offline `coverage-badge.svg` + `coverage-summary.json` to `<dir>`. No network calls. |
| `--help` / `--version` | `-h` / `-v` | |

```bash
gen-comments src --write --force            # re-document already-commented files
gen-comments src --check                    # CI gate: undocumented symbols
gen-comments src --check-drift              # CI gate: JSDoc drifted from AST
gen-comments src --lint                     # CI gate: JSDoc content is invalid
gen-comments src --coverage-badge docs      # docs/coverage-badge.svg + coverage-summary.json
```

> Commit before running `--write` — the CLI warns if you're outside a git repo.

---

## `--lint` — JSDoc validation, no ESLint required

You don't need ESLint installed to validate your JSDoc — `gen-comments --lint` runs the
same category of checks [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)'s
`recommended` config does, directly, with zero new dependencies:

```bash
gen-comments src --lint
```

```
Linting JSDoc across 3 file(s)...

  src/auth.ts  (lint)
    src/auth.ts:12  login  require-param-description  @param "password" has no description.
    src/auth.ts:12  login  check-tag-names  Unknown tag "@parm".

2 lint issue(s) found.
```

v1.18.0 ships the rules closest to eslint-plugin-jsdoc's own `recommended` starting set —
more are queued (see the project's public backlog for the full rule-by-rule comparison):

| jsdoc-scribe (`--lint`) | eslint-plugin-jsdoc equivalent | Status |
|---|---|---|
| `require-jsdoc` | `require-jsdoc` | Shipped v1.18.0 |
| `require-param`, `require-param-description` | `require-param`, `require-param-description` | Shipped v1.18.0 |
| `check-param-names` (ordering) | `check-param-names` | Shipped v1.18.0 |
| `require-returns`, `require-returns-description`, `require-returns-check` | same names | Shipped v1.18.0 |
| `require-description` | `require-description` | Shipped v1.18.0 |
| `check-tag-names` | `check-tag-names` | Shipped v1.18.0 |
| `empty-tags` | `empty-tags` | Shipped v1.18.0 |
| `no-multi-asterisks`, `no-blank-block-descriptions`, `no-bad-blocks` | same names | Shipped v1.18.0 |
| `require-throws`, `require-yields` | same names | Planned (sprint 12) |
| Type-string validation (`valid-types`, `check-types`, `reject-any-type`, ...) | same | Planned, needs a type-expression tokenizer |
| `no-undefined-types`, full `check-access` | same | Gated on the in-progress Checker-API epic |

`--lint` itself is always read-only and report-only — pair it with `--fix` (below) when you
want issues corrected, not just reported.

---

## `--fix` — autofix lint issues

```bash
gen-comments src --lint --fix
```

`--fix` implies `--lint` and rewrites *existing* JSDoc blocks in place to resolve as many
findings as it safely can, without guessing:

- **Mechanical fixes** — reorders `@param` tags to match the real parameter order, strips
  trailing text off a tag that should never carry one (e.g. `@readonly`), collapses stray
  extra asterisks, and drops an unnecessary `@returns` on a function that never returns a
  value.
- **Placeholder fixes** — a missing block description, `@param` description, or `@returns`
  description is filled with a fixed, deterministic template: `TODO: describe what this
  does.` / `TODO: describe parameter "name".` / `TODO: describe the return value.` This is
  never invented prose — same text every time for the same kind of gap, clearly marked so a
  human immediately knows it needs a real description (`grep -r "TODO: describe"` finds
  every one `--fix` has ever left behind).

```bash
gen-comments src --lint --fix
```

```
Fixing JSDoc lint issues across 3 file(s)...

  src/auth.ts  (fixed 2/3 issue(s))
  src/auth.ts  (lint — 1 remaining)
    src/auth.ts:12  login  check-tag-names  Unknown tag "@parm".

2 issue(s) fixed across 1 file(s).
1 issue(s) remain — see above (typically check-tag-names, which --fix never auto-corrects).
```

**What `--fix` deliberately doesn't do:**

- **Add JSDoc to undocumented symbols.** A `require-jsdoc` finding (no block at all) is left
  untouched — that's `--write`'s job.
- **Rename an unknown/typo'd tag.** `check-tag-names` findings (e.g. `@parm` instead of
  `@param`) always survive `--fix` — there's no safe default for what the tag should have
  been, and guessing would be a real departure from "no AI, no guessing," unlike the fixed
  placeholder templates above.

A file with zero lint issues is left byte-identical, and running `--fix` twice in a row
produces zero additional changes the second time. See
[`docs/backlog/adr-013-lint-autofix.md`](./docs/backlog/adr-013-lint-autofix.md) for the
full design reasoning.

---

## `gen-docs` — build a documentation site

```bash
gen-docs src --out docs --title "My Project"
# open docs/index.html
```

Self-contained static output, no server required:

```
docs/
  index.html            # module index
  search-index.js       # client-side search
  assets/{style.css,app.js}
  modules/*.html
```

### Flags

| Flag | Short | Description |
|---|---|---|
| `--out <dir>` | `-o` | Output directory (default `docs`). |
| `--title <name>` | `-t` | Site title. |
| `--json` | `-j` | Also write `docs.json`. |
| `--readme` | `-r` | Also write a markdown table README. |
| `--source-url <url>` | `-s` | GitHub blob base URL — adds per-card "line N" source links. |
| `--ignore <glob>` | `-I` | Exclude glob, repeatable. |
| `--config <file>` | `-c` | Path to `.jsdoc-scribe.json`. |
| `--watch` | `-W` | Rebuild on file change (150ms debounce). |
| `--help` / `--version` | `-h` / `-v` | |

### Config file (`.jsdoc-scribe.json`)

```json
{
  "out": "docs",
  "title": "My Project",
  "sourceUrl": "https://github.com/org/repo/blob/main",
  "ignore": ["**/internal/**", "**/*.test.ts"]
}
```

CLI flags override config values.

---

## Programmatic API

Ships with hand-written TypeScript declarations (`lib/index.d.ts`, `lib/docs.d.ts`) — no
`@types/jsdoc-scribe` package needed, autocomplete works out of the box in both `.js` and
`.ts` consumers.

### `require('jsdoc-scribe')` — JSDoc insertion

```js
const { processFile, analyseFile, collectFiles } = require('jsdoc-scribe');

const files = collectFiles('src');                       // recurse a directory
for (const f of files) {
  const added = processFile(f, { write: true });          // insert missing JSDoc blocks
  console.log(f, added);
}

const coverage = analyseFile('src/auth.ts');              // { documented, total, undocumented }
```

### `require('jsdoc-scribe/docs')` — doc-site generation

```js
const { generateSite } = require('jsdoc-scribe/docs');
const fs = require('fs'), path = require('path');

(async () => {
  const pages = await generateSite(['src'], { projectName: 'My Project', version: '1.0.0' });
  for (const p of pages) {
    const dest = path.join('docs', p.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, p.html, 'utf8');
  }
})();
```

`generateSite` is `async` (it batches file extraction with `Promise.allSettled` internally) — call it from inside an `async` function or wrap it, as above; it does not return the pages array directly.

Also exported from `jsdoc-scribe/docs`: `collectFiles`, `extractModule`, `extractModules`, `buildSite`, `moduleLabel`, `moduleHtmlPath`. `extractModule(filePath)` returns `{ filePath, description, functions[], classes[], interfaces[], typeAliases[], enums[], variables[] }` — each entry carries both the AST-inferred shape (`params`, `returnType`) and the parsed JSDoc (`jsdocParams`, `returns`, `throws`, `since`, `deprecated`).

### `require('jsdoc-scribe/lint')` — JSDoc validation

The same rule engine `gen-comments --lint` runs under the hood, callable directly against
an already-extracted module — useful for a custom reporter, a pre-commit hook that only
lints staged files, or building your own tooling on top without shelling out to the CLI:

```js
const { extractModule } = require('jsdoc-scribe/docs');
const { lintModule, KNOWN_TAGS, NO_DESC_TAGS } = require('jsdoc-scribe/lint');

const moduleData = extractModule('src/auth.ts');
const issues = lintModule(moduleData);   // [{ symbol, rule, message, line }, ...]

for (const issue of issues) {
  console.log(`${moduleData.filePath}:${issue.line}  ${issue.symbol}  ${issue.rule}  ${issue.message}`);
}
```

`lintModule` is pure and synchronous — no I/O, no network, same input always produces the
same output. `KNOWN_TAGS` (83 entries) and `NO_DESC_TAGS` (17 entries) are exported as
`Set<string>` if you want to reuse jsdoc-scribe's own tag reference data in something else
you're building (this is exactly how
[`eslint-plugin-jsdoc-scribe`](./packages/eslint-plugin-jsdoc-scribe) reuses them). Type
declarations ship in `lib/lint.d.ts`.

---

## CI — GitHub Actions

Every CLI flag is a plain process exit code (`0` clean, `1` findings), so any of them drop
straight into a `run:` step. Two complete, ready-to-copy workflows:

### PR quality gate — comments, drift, and lint

Fails the check if anything is undocumented, JSDoc has drifted from the code, or JSDoc
content itself is malformed — three independent signals, one job:

```yaml
# .github/workflows/jsdoc-quality.yml
name: JSDoc quality gate
on:
  pull_request:
    branches: [main]
jobs:
  jsdoc:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Fail if anything is undocumented
        run: npx gen-comments src --check
      - name: Fail if JSDoc has drifted from the AST
        run: npx gen-comments src --check-drift
      - name: Fail if JSDoc content is invalid
        run: npx gen-comments src --lint
```

Each step runs independently (not `&&`-chained) so a PR's Actions tab shows exactly which
of the three checks failed, rather than one opaque "the script exited non-zero." Drop any
step you don't want as a hard gate yet.

### Auto-deploy docs to GitHub Pages

```yaml
# .github/workflows/docs.yml
name: Deploy docs
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx gen-docs src --out _site --title "${{ github.event.repository.name }}" --source-url "https://github.com/${{ github.repository }}/blob/main" --json
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
      - id: deployment
        uses: actions/deploy-pages@v4
```

Enable GitHub Pages (Settings → Pages → Source: GitHub Actions).

The PR quality gate above is a template — copy it into your own project's
`.github/workflows/`. This repo's own CI is three separate workflows you can look at
directly: [`test.yml`](./.github/workflows/test.yml) runs the 152-test suite on Node
18/20/22 for every push and PR (that's the badge at the top of this README),
[`docs.yml`](./.github/workflows/docs.yml) is the exact Pages-deploy job shown above, and
[`publish.yml`](./.github/workflows/publish.yml) publishes tagged releases via npm's OIDC
trusted publishing (no stored token; every published version carries verifiable
provenance).

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
- `gen-docs` site generation degrades superlinearly past ~300-500 source files (redundant per-page path-prefix recomputation) — fix in progress, tracked in `docs/backlog/`.

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## License

MIT © [Chintan](https://github.com/imchintoo)
