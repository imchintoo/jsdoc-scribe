# jsdoc-scribe

[![npm version](https://img.shields.io/npm/v/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![npm downloads](https://img.shields.io/npm/dm/jsdoc-scribe.svg)](https://www.npmjs.com/package/jsdoc-scribe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/jsdoc-scribe.svg)](https://nodejs.org)
[![Types: included](https://img.shields.io/badge/types-included-blue.svg)](./lib/index.d.ts)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen.svg)](https://imchintoo.github.io/jsdoc-scribe/)

**Reads your code's actual AST and writes the JSDoc for it — no AI, no guessing, same input always gives the same output.**

## Why this exists

Docs go stale because writing them by hand is boring and nobody updates them when the code
changes. Asking an AI to write them instead just trades "stale" for "confidently wrong" — it
can describe what a function *probably* does, not what it actually does. jsdoc-scribe skips
both problems: it reads the real AST — actual parameter names, actual types, actual return
paths — and generates from that. If the code changes, regenerate. There's nothing to keep in
sync by memory, and nothing invented to fact-check.

## See it work

Input — a plain function and method, no comments:

```js
function calculateTotal(items, taxRate) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 + taxRate);
}

async function getUserOrders(userId, db) {
  return db.orders.find({ userId });
}
```

`gen-comments orders.js --write` → this, in place, nothing else touched:

```js
/**
 * Calculates the total.
 * @param {any} items - array of items.
 * @param {any} taxRate - tax rate.
 * @returns {any}
 */
function calculateTotal(items, taxRate) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0) * (1 + taxRate);
}

/**
 * Returns the user orders.
 * @async
 * @param {any} userId - user unique identifier.
 * @param {any} db - database connection.
 * @returns {any}
 */
async function getUserOrders(userId, db) {
  return db.orders.find({ userId });
}
```

That's really it — this is plain untyped JS, so the types come back `any` (see [Known
limitations](#known-limitations)). Run it against a TypeScript file and the same param/return
types you already wrote show up in the JSDoc instead. `gen-docs` then turns files like this
into a browsable HTML site — [live preview below](#preview).

## Quick start

```bash
npx jsdoc-scribe src --write     # try it on your own code, right now, no install
```

Once it's actually installed (`npm install --save-dev jsdoc-scribe` — see
[Install](#install)), `gen-docs src --out docs` builds a browsable HTML site from what you just
wrote.

Nothing gets sent anywhere — no network calls, no API key, no account. It's a CLI reading
files on your disk and writing files back to your disk, backed by one runtime dependency
(`typescript`, used purely as a syntax parser) and a self-test suite that runs on every
`npm test` and before every publish.

## Should you use this?

**Yes, if:** you want JSDoc coverage that doesn't drift from the code, want a docs site
without wiring up a separate static-site generator, or want a CI gate that fails when
something ships undocumented — without adding an LLM call to your pipeline.

**Skip it if:** you want prose that explains *why* the code does something, not just its
shape. jsdoc-scribe only knows what's structurally true in the AST — a param name, a return
type, a class hierarchy. It will never write "this exists to work around a vendor API quirk"
for you, because it doesn't know that and won't pretend to.

## What's in the box

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source by reading the AST |
| `gen-docs` | Builds a static, multi-page HTML documentation site from your documented source |

- **JSDoc linting without ESLint.** `--lint` runs the same category of checks
  [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)'s `recommended` config
  does; `--lint --fix` auto-corrects what's mechanically safe (tag order, stray asterisks) and
  leaves a `TODO:` placeholder for what needs a human, never invented text. Already on ESLint?
  The same rules ship as a native flat-config plugin —
  [`eslint-plugin-jsdoc-scribe`](./packages/eslint-plugin-jsdoc-scribe/README.md).
- **`--check-drift`** flags JSDoc that no longer matches the code it's describing — a param
  renamed or removed, a return type that changed — the "docs quietly went stale" problem, caught
  in CI before merge.
- **Architecture Insight page.** Every `gen-docs` run includes a plain-English read of your
  folder structure, detected framework, and architecture-pattern signals — each shown with the
  actual evidence (a `bin` entry, matching directory names), never a bare guess.
  [Details](https://imchintoo.github.io/jsdoc-scribe/docs/architecture-insight.html).
- **Optional Code Health dashboard** (`--quality`, via the optional
  [code-multivitals](https://www.npmjs.com/package/code-multivitals) peer dependency) —
  complexity, maintainability, duplicate-code, and orphan-file stats on the same files you
  just documented.

## Three ways to use it

| | Comments | Docs | Lint |
|---|---|---|---|
| **CLI** | `gen-comments src --write` | `gen-docs src --out docs` | `gen-comments src --lint --fix` |
| **In your code** | `require('jsdoc-scribe').processFile(file, opts)` | `require('jsdoc-scribe/docs').generateSite(['src'], opts)` | `require('jsdoc-scribe/lint').lintModule(data)` |
| **CI (GitHub Actions)** | `npx gen-comments src --check` (PR gate) | `npx gen-docs src --out _site` (Pages deploy) | `npx gen-comments src --lint` (PR gate) |

Every flag is a plain `0`/`1` exit code, so any row above drops straight into a `run:` step —
this repo's own [`test.yml`](./.github/workflows/test.yml) and
[`docs.yml`](./.github/workflows/docs.yml) are the same pattern, running live. Full
walkthroughs: [CLI Usage](https://imchintoo.github.io/jsdoc-scribe/docs/cli.html) ·
[Programmatic API](https://imchintoo.github.io/jsdoc-scribe/docs/programmatic-api.html) ·
[GitHub Actions](https://imchintoo.github.io/jsdoc-scribe/docs/github-actions.html).

## Preview

Real `gen-docs` output against [`sample/`](./sample) — not a mockup.

![jsdoc-scribe docs preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview.png)

![jsdoc-scribe Code Health dashboard preview](https://raw.githubusercontent.com/imchintoo/jsdoc-scribe/main/assets/preview-quality.png)

## Benchmarks

No caching between runs, measured directly against the CLIs:

| Source size | `gen-comments --dry-run` | `gen-docs` (single file) |
|---|---|---|
| 231 LOC | 1.15s | 0.49s |
| 23K LOC | 1.47s | 0.71s |
| 233K LOC | 4.17s | 2.29s |

A real 1,000-file/70K-LOC project finishes `gen-comments --write` in ~1s. Both CLIs scale
close to linearly with source size — `gen-docs`'s multi-file build had a superlinear ceiling
past ~300-500 files, fixed and now enforced continuously in CI via `npm run bench:perf-gate`,
not just measured once. Full numbers: [CHANGELOG](./CHANGELOG.md).

## Known limitations

Said plainly, not buried:

- Inline anonymous callbacks (`arr.map(x => x * 2)`) aren't documented — named declarations only.
- Type inference is 100% syntactic — no evaluation, no imports, no type-checking. Untyped JS
  gets `any`, same as the example above.
- Multi-declarator statements (`const a = 1, b = 2;`) get one combined block.
- `.d.ts` files are skipped.
- `gen-docs` doesn't serve its output — use `npx serve docs` or deploy statically.
- `gen-docs` holds every generated page in memory until the whole site is built, then writes it
  all at once — a memory-footprint concern at very large (thousands-of-files) scale, not yet
  sized against real hardware.
- Not yet compatible with TypeScript 7 — the `typescript` npm package's programmatic API isn't
  available at all under 7.0 (a stable API is expected in 7.1, ~October 2026); `typescript` is
  pinned to `<7.0.0` until then.

## Install

```bash
npx jsdoc-scribe . --write            # run once, no install
npm install --save-dev jsdoc-scribe   # add to project
npm install -g jsdoc-scribe           # or install globally
```

## Documentation

Full docs, quick-start, and every flag reference: **[imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/)**.
Real multi-framework sample code (Express, NestJS, plain JS) to try the CLIs against without
writing your own fixtures lives in [`sample/`](./sample).

## Contributing

Bug reports and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) (determinism is
non-negotiable, no new runtime dependency without discussion first). This project follows the
[Code of Conduct](./CODE_OF_CONDUCT.md). Found a security issue? See
[SECURITY.md](./SECURITY.md) rather than opening a public issue with exploit details.

## License

MIT © [Chintan](https://github.com/imchintoo)
