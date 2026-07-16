---
slug: we-automated-documentation-out-of-existence
title: 'We Automated Documentation Out of Existence — Here''s What It Saved Us'
description: The story of jsdoc-scribe — a free, 100% local, AST-based JSDoc generator and doc-site builder — and the real numbers behind adopting it.
date: 2026-07-16
readingTime: 7 min read
tags: [SoftwareEngineering, Documentation, DevOps, TypeScript, NodeJS, EngineeringManagement]
image: ../assets/we-automated-documentation-out-of-existence.png
---

Ask any engineering manager what slows down onboarding, and "documentation" rarely tops the list out loud — but it's almost always the real answer underneath. Code gets shipped. Docs, if they exist at all, get written once, during a burst of good intentions, and then rot the moment the next PR merges. Six months later, the only reliable documentation left is whatever lives in the heads of two or three senior engineers.

That's not a documentation problem. That's a business-continuity problem. If those two or three people are unavailable — on leave, transitioning off the team, or gone — the org is exposed, and every new hire pays for it with weeks of code-spelunking instead of shipping.

We built `jsdoc-scribe` to remove that dependency entirely — and this post walks through exactly what it does, what it cost to get right, and what it actually saves a team, with real numbers rather than marketing language.

## What jsdoc-scribe actually is

`jsdoc-scribe` is an automated, **AST-based** JSDoc comment generator and static documentation site builder for JavaScript and TypeScript.

Two things worth underlining immediately, because they're the whole thesis of the tool:

**No AI. No LLM. No surprises.** It doesn't call out to an API, doesn't burn tokens, and doesn't hallucinate a plausible-sounding but wrong description of what your function does. It reads your code's actual Abstract Syntax Tree — via the TypeScript compiler API, used purely as a syntax parser — and generates documentation from what the code *actually is*. Same input always produces the same output, deterministically, every time.

**100% local.** Nothing leaves your machine or your CI runner. No proprietary source code gets sent to a third-party LLM provider. For any team that's ever had a security review flag "we're piping our codebase through an external AI API" as a finding, this is a non-issue by design.

It ships as two CLIs bundled into a single npm package, with one dependency total (`typescript`, `>=5.0.0 <7.0.0`, used as the parser):

| Tool | What it does |
|---|---|
| `gen-comments` | Inserts `/** */` JSDoc blocks into your source by reading the AST — no guessing |
| `gen-docs` | Builds a static, multi-page HTML documentation site from your documented source |

Both are usable three ways — as a CLI, as a plain programmatic Node API (`processFile`, `generateSite`, `lintModule`, with hand-written TypeScript declarations so no `@types` package is needed), or wired directly into GitHub Actions as a PR gate or a Pages deploy step. This project's own CI runs the exact same workflows it documents for consumers, including npm OIDC trusted publishing with no stored token sitting in a secrets vault.

## The management case: what this actually costs and saves

Start with the number that matters most to anyone holding a budget: **it's free.** MIT licensed, `npm install`, done. No per-seat SaaS pricing, no metered API bill for an LLM to "read your code and write docs" — a category of tool that's proliferated over the last two years, almost always priced per token or per seat, and almost always requiring your source code to leave your infrastructure.

Beyond the license cost, here's where the real savings show up:

**Zero ongoing engineering overhead.** Documentation stops being a sprint task, a ticket nobody wants, or a "we'll get to it" backlog item. It's generated automatically, every build, directly from the code that already exists. Nobody manually syncs a markdown file to a function signature that changed three commits ago — `gen-comments --check-drift` catches that automatically and can gate a PR before it merges.

**Faster onboarding, with a real case study behind the number.** In [Halving Engineering Overhead](./halving-engineering-overhead-documentation-automation.html), we walked through a real adoption scenario: a team whose architecture had become locked inside a handful of senior engineers' heads, after a manual documentation initiative had already failed. After adopting `jsdoc-scribe`, engineering transition overhead dropped by **50%**, and new-engineer onboarding time dropped by **over 70%** — new hires went from weeks of code-combing to shipping in their first week.

**Predictable, fast CI cost.** Measured directly against the CLIs, single Node process, no caching between runs:

| Source size | `gen-comments --dry-run` | `gen-docs` (single file) |
|---|---|---|
| 231 LOC | 1.15s · 96 MB | 0.49s · 94 MB |
| 23K LOC | 1.47s · 167 MB | 0.71s · 155 MB |
| 233K LOC | 4.17s · 345 MB | 2.29s · 445 MB |

A real 1,000-file, ~70K-line project finishes `gen-comments --write` in **1.03 seconds at 115 MB**. That's not a toy benchmark — it's the CLI running against real, runnable-shaped fixtures covering Express, NestJS, and plain JS, not synthetic one-liners.

## A scaling bug we found, fixed, and locked in for good

`gen-docs`'s multi-file site generation had a superlinear scaling ceiling past roughly 300–500 files — root-caused with `node --prof`, not guessed at, and traced to an O(N³) sidebar-path recomputation, not the parsing step (profiling confirmed the TS Compiler API parse phase was nowhere close to being the bottleneck, which is why `worker_threads` parallelization was evaluated and explicitly *not* pursued). The fix, shipped in v2.4.2, was two targeted, additive changes: memoizing the repeated path computation, and precomputing each sidebar tree node's default HTML once per build instead of once per page. The result:

| Files | Before the fix | After the fix |
|---|---|---|
| 400 | 28.38s | 0.90s (**31x faster**) |
| 500 | didn't reliably complete | 2.40s |
| 1,000 | — | 4.68s |

Scaling from 400 to 1,000 files (2.5x the files) now costs roughly 5.2x the time — down from an unbounded curve. A dedicated perf-gate script (`npm run bench:perf-gate`) runs in CI on every push to `main`, asserting the scaling ratio stays bounded, so this class of regression can never silently creep back in.

## Framework and stack coverage

`jsdoc-scribe` isn't tested against toy examples. The repo ships real, runnable-shaped sample fixtures covering the stacks teams actually build with: **Express.js (TypeScript)** — routes, a controller, a service, auth middleware; **NestJS (TypeScript, decorators)** — `@Controller`/`@Injectable` classes, a `class-validator` DTO, an entity, a guard; **vanilla JavaScript (CommonJS)** — a logger, event emitter, retry/circuit-breaker helper, input validators; and **generic TypeScript** — a dependency-injection container, error hierarchy, event bus, HTTP middleware.

As of v2.4.8, every generated documentation site also includes an automatic **Architecture Insight** page — a plain-English read of your project's folder structure, its detected framework (React, Next.js, Angular, Vue, Express, or NestJS, identified from your actual dependencies), and architecture-pattern signals across 23 recognized patterns (CLI tool, publishable library, monorepo, Layered, MVC, Hexagonal, Onion, Repository, Vertical Slice, Feature-Based, Modular Monolith, Serverless, and more). Every signal is shown with the concrete evidence that triggered it — a `bin` entry, an `exports` field, a matching directory name — never a bare, unexplained guess. No new flag required, no AI involved, and the page is simply omitted when a project has nothing detectable.

## Code health, not just documentation

Pass `--quality` and the generated site's index page becomes a full Code Health dashboard — health score, maintainability, complexity, duplicate-code detection, and orphan-file stats, each with its own detail page, plus a per-file health strip on every module page and a per-function/method drill-down. It's an optional integration (`code-multivitals` as a peer dependency, never installed by default), so `gen-docs` behaves identically whether it's present or not. In practice: as the documentation gets clearer, the codebase tends to get cleaner too.

## Reliability, taken seriously

Worth telling because it says more about engineering discipline than any feature list: in v2.4.3, we caught and fixed a silent-failure bug tied to a TypeScript major-version bump. If a file failed to parse mid-run, the CLI logged it but still exited `0` — meaning `--check`, `--check-drift`, `--lint`, and plain `--write` runs could all print a false "all clean" message even when files had silently failed. We pinned the TypeScript dependency range, and every one of the six affected CLI code paths now tracks failures explicitly: a parse failure forces a non-zero exit and an honest "N file(s) failed to parse" message instead of a false-positive success.

That's the standard the whole project holds itself to: **234 passing tests, deterministic, zero network calls** — the same self-test suite runs on every `npm test` and before every `npm publish`.

## The bottom line

If documentation tooling is part of your budget conversation this quarter, the honest pitch is this: it's free, it runs entirely inside your own infrastructure, it's fast enough to run on every single CI build without anyone noticing the cost, and — based on a real adoption case study — it can cut engineering transition overhead by half and onboarding time by more than two-thirds.

No AI subscription. No per-seat license. No data leaving your building. Just your code, read accurately, every time.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs, benchmarks, and the changelog live in the [docs](../docs/quick-start.html) section of this site. The package is on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), MIT licensed, maintained in the open at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
