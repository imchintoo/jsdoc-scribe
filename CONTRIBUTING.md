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
calls, no snapshots that require external services.

## Guidelines

- **Determinism is non-negotiable.** Every code path must produce the same output for the
  same input, every time. No randomness, no timestamps in generated output, no network
  calls.
- **No new runtime dependencies** without a design discussion first — the project
  deliberately stays at one runtime dependency (`typescript`), used as a syntax parser (see
  `docs/backlog/adr-010-checker-api-and-ast-ergonomics.md` for the reasoning behind that
  constraint).
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
