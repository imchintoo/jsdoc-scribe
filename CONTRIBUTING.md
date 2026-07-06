# Contributing to jsdoc-scribe

Thanks for considering a contribution. jsdoc-scribe is deliberately small in scope —
pure, deterministic, AST-based JSDoc generation and doc-site building, no AI/LLM involved.
Keeping that pitch honest is part of reviewing any change.

## Before you start

- **Bug fix or small improvement:** open a PR directly.
- **New feature or behavior change:** open an issue first describing the problem and your
  proposed approach, so we can agree on scope before you invest time in a patch.

## Development setup

```bash
git clone https://github.com/imchintoo/jsdoc-scribe.git
cd jsdoc-scribe
npm install
npm test
```

`npm test` runs the full deterministic self-test suite (`node test/run.js`) — no network
calls, no snapshots that require external services. Node >=18 is required to run the
internal dashboard/quality tooling below (the published package itself still only requires
Node >=14 — see `package.json` `engines`).

## Project dashboard (contributors)

`npm run docs:internal` generates jsdoc-scribe's own API docs (`lib/`, `bin/`, the eslint
plugin package) with a "Code Health" section (code-multivitals's metrics plus the
import-graph/orphan-file findings) embedded directly into `docs-internal/index.html` —
one artifact, no separate dashboard file. Not part of the published package; useful for
getting oriented in this repo specifically. See
`docs/backlog/adr-phase-j-project-dashboard.md` for the design (revised 2026-07-06 to fold
the dashboard into the normal doc site rather than a second file).

`npm run quality` runs code-multivitals directly against `lib/`, `bin/`, and the eslint
plugin package with a plain console report (no site build, no embedded section).

## Guidelines

- **Determinism is non-negotiable.** Every code path must produce the same output for the
  same input, every time. No randomness, no timestamps in generated output, no network
  calls. (Exception: code-multivitals's own snapshot/trend files are legitimately
  timestamped by that tool's own contract — this applies to jsdoc-scribe's own output, not
  to an integrated third-party tool's documented behavior.)
- **No new *runtime* dependencies** without a design discussion first — the published
  package deliberately stays at one runtime dependency (`typescript`), used as a syntax
  parser (see `docs/backlog/adr-010-checker-api-and-ast-ergonomics.md` for the reasoning
  behind that constraint). This guideline is specifically about `dependencies` (what ships
  to end users via `package.json` `files`) — **`devDependencies`** (e.g. `code-multivitals`,
  used only for this repo's own internal dashboard/quality tooling) and **optional
  `peerDependencies`** (e.g. `code-multivitals` again, this time as `gen-docs --quality`'s
  opt-in end-user feature — never auto-installed, never required) are a different category
  and don't need the same discussion, though any new one is still worth flagging in a PR
  description. See `docs/backlog/adr-phase-j-project-dashboard.md` for the full reasoning
  the first time this distinction came up.
- **Tests required.** New behavior needs a corresponding test in `test/`. `npm test` must
  stay green.
- **Keep PRs focused.** One logical change per PR — easier to review, easier to revert if
  something's wrong.

## Reporting bugs

Open a [GitHub issue](https://github.com/imchintoo/jsdoc-scribe/issues) with:

- jsdoc-scribe version (`npx jsdoc-scribe --version`) and Node version
- A minimal source snippet that reproduces the issue
- What you expected vs. what happened

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you're
expected to uphold it.
