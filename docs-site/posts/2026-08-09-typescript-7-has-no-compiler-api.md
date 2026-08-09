---
slug: typescript-7-has-no-compiler-api
title: 'TypeScript 7.0 Has No Compiler API — Here''s Why That''s Already in Our package.json'
description: TypeScript 7.0 shipped stable with a 10x-faster Go-native compiler and no programmatic API until 7.1. Here's why that matters for any AST-based tool, and why jsdoc-scribe already pins below it.
date: 2026-08-09
readingTime: 6 min read
tags: [TypeScript, DeveloperTools, CompilerAPI, AST, JavaScript]
image: ../assets/typescript-7-has-no-compiler-api.png
---

TypeScript 7.0 shipped stable on July 8, 2026, and the headline number is the one everyone's repeating: a Go-native compiler port, codenamed Project Corsa internally, that runs roughly 8–12x faster than TypeScript 6.0 on a full build. VS Code's own codebase — about 1.5 million lines — went from a ~78-second compile to about 7.5 seconds. That's a real, well-earned upgrade story, and most of the coverage this month has stopped there.

The line worth reading past the speed number is quieter and matters a lot more if you build tooling on top of TypeScript rather than just compiling with it: **TypeScript 7.0 ships with no stable, JavaScript-accessible programmatic Compiler API.** That's not a bug or an oversight — it's landing in 7.1, on Microsoft's own stated roadmap. But for the entire category of tools that read a TypeScript project's Abstract Syntax Tree programmatically, "wait for the next minor version" is the honest current answer, not a workaround.

`jsdoc-scribe` is one of those tools, and this isn't news to us. Open `package.json` in this repo and the dependency has read the same way for a while now:

```json
"typescript": ">=5.0.0 <7.0.0"
```

That upper bound has been there before this post was ever going to be written. What changed this month is that the reason for it stopped being a defensive guess about an unreleased compiler and became a documented, verifiable fact about a shipped one.

## What the Compiler API actually does for a tool like this

It's worth being precise about what "AST-based" means in practice, because it's easy to wave at without explaining. `jsdoc-scribe` reads a project's Abstract Syntax Tree via the TypeScript compiler API — used purely as a parser, never a model, with no AI or LLM anywhere in the pipeline. That's how both CLIs work: `gen-comments` walks a function's actual signature (real parameter names, real types, real return annotations) to generate a deterministic JSDoc block, and `gen-docs` walks the same structure to build a documentation site, an Architecture Insight page, and — with `--quality` — a code-health dashboard through the optional `code-multivitals` peer dependency. The `--check-drift` flag that gates CI on stale comments works the same way: re-parse the AST, compare it against the existing JSDoc block, fail the build if they've diverged.

None of that is possible without a way to programmatically ask the compiler "what does this function's signature actually look like." That's exactly the surface TypeScript 7.0 doesn't expose yet. The Go rewrite is a faithful port — it preserves TypeScript's type-checking semantics exactly, unlike a stripped transpiler such as esbuild or swc — but a faithful port of the type checker isn't the same thing as a stable, documented way for an external Node process to call into it. That second piece is specifically what's scheduled for 7.1, not 7.0.

## We're not the only ones waiting

This isn't a jsdoc-scribe-specific problem, which is itself useful context if you're deciding how seriously to take it. TypeDoc — the most widely used TypeScript reference-doc generator, at roughly 1.47M weekly downloads — tracks this openly on GitHub. Its maintainers describe TypeScript 7's API as "a complete rewrite from the TypeScript 6 and prior APIs," not an incremental change, and as of July 2026 report being "down to 70 compiler errors" against a TypeScript 7.1 nightly build, with a beta planned once that nightly stabilizes toward an actual 7.1 RC (TypeStrong/typedoc issues #3098 and #3053).

The same wall shows up outside the documentation-tooling category entirely. `typescript-eslint` can't lint against the 7.0 API yet for the same reason. Template type-checking for Vue, Svelte, Astro, MDX, and Angular — all of which reach into TypeScript's compiler internals to type-check code living outside plain `.ts` files — isn't supported on TypeScript 7 yet either, for the identical root cause. If your team runs any of that tooling, this same constraint is already sitting somewhere in your dependency tree, whether or not anyone's written it down yet.

## What changes once 7.1 ships, and what doesn't yet

To be direct about the current state rather than promise ahead of it: nothing about jsdoc-scribe changes today. The `<7.0.0` pin stays exactly where it is until there's a stable 7.1 API to target, and lifting it before then would mean shipping against a moving, pre-release surface — which runs directly against the "same input, same output, nothing invented" premise this tool is built on. A parser that silently breaks on an unstable upstream API is a worse outcome than a version pin that's honest about a real limitation.

Once TypeScript 7.1's programmatic API lands and stabilizes, the practical move is the same one TypeDoc is already running: build and test against the new API directly, watch for the kind of ecosystem-wide validation signal TypeDoc's own issue tracker provides, and lift the pin once compatibility is actually verified — not projected. That's a slower path than promising day-one 7.1 support the moment it's tagged, and it's the correct trade for a tool whose entire pitch is determinism over speed-to-claim.

## What to check in your own stack this week

If you're evaluating the jump to TypeScript 7 for the build-speed win — and an 8–12x compile-time improvement is a legitimate reason to want it — the question worth asking before you upgrade isn't "does `tsc` still work." It almost certainly does; the port preserves type-checking semantics. The question is whether anything in your pipeline reaches into the Compiler API programmatically: a documentation generator, a custom ESLint rule, a codemod, a framework's template checker, an internal script that walks your AST for any reason. Any of those is exposed to the exact gap described here, whether or not the tool's own release notes say so explicitly yet. Checking now, before an upgrade, is a five-minute `package.json` read. Finding out during a CI failure after the upgrade is a worse way to learn the same fact.

## Bottom line

TypeScript 7.0's 10x compiler is a genuine, well-deserved milestone, and it's not the part of this release that AST-based tooling needs to worry about. The part that matters is narrower and more specific: the programmatic API those tools depend on isn't in 7.0 at all, it's scheduled for 7.1, and the entire category of tools built on top of it — jsdoc-scribe included — is waiting on the same timeline TypeDoc is publicly tracking. The `<7.0.0` pin already in this project's `package.json` wasn't a guess about a hypothetical future release. It was always going to be exactly this.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
