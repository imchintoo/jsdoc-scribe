---
slug: your-ai-agent-is-only-as-good-as-its-docs
title: 'Your AI Agent Is Only As Good As Its Docs: What "Context Rot" Means for Your Codebase'
description: A new arXiv paper names the failure mode where stale documentation silently degrades AI coding agents. Here is what the research actually measured, and why deterministic, drift-checked docs are a mechanical fix rather than a cultural one.
date: 2026-07-31
readingTime: 7 min read
tags: [AI, DeveloperTools, TypeScript, Documentation, EngineeringManagement]
image: ../assets/your-ai-agent-is-only-as-good-as-its-docs.png
---

Every team using an AI coding agent has hit this moment without naming it: the agent confidently suggests a call to a function that was renamed two sprints ago, or imports a module that got deleted in a refactor last month. Nobody gets an error. The suggestion just looks plausible, compiles in the agent's head, and is wrong — because the context the agent was reading to understand your codebase stopped matching the codebase itself somewhere along the way.

That failure mode now has a name, a formal description, and a paper behind it: **context rot**.

## What context rot actually is

A 2026 paper, *Context Rot in AI-Assisted Software Development* (arXiv:2606.09090), studies exactly this problem. Teams increasingly hand AI coding agents persistent, repo-level context through files like `CLAUDE.md`, `AGENTS.md`, and `.cursorrules` — plain-text descriptions of code structure, architecture, and conventions that live alongside the code and get read into the agent's context window on every session. That's a reasonable pattern; it's also the entire premise this blog covered a year ago when we argued that documentation stops being useful the moment it drifts from the code it describes.

The paper's contribution is naming what happens next: as the underlying code changes, that context degrades — silently. No build fails, no linter flags it, no error surfaces. The model just starts referencing functions that no longer exist, suggesting imports for modules that were deleted, or enforcing a convention the team abandoned months ago. The agent isn't malfunctioning. It's doing exactly what it was told, using a description of your codebase that's no longer true.

This is a documentation-freshness problem wearing an AI costume. The mechanism — hand-maintained descriptive text that nobody updates on every commit — is the same failure mode teams have been fighting in READMEs and wikis for two decades. The only thing that changed is who's reading the stale text now.

## The number that makes this concrete

If context rot sounds like a soft, hard-to-quantify concern, a companion paper puts a hard number on the flip side. *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents* (arXiv:2601.20404) measured agent behavior across 124 pull requests in 10 repositories, comparing runs with and without an AGENTS.md file present. The presence of accurate, current repo context was associated with a **28.64% lower median runtime** and **16.58% fewer output tokens** consumed by the agent, with comparable task-completion quality.

Read that the way an engineering budget owner would: accurate context isn't just a correctness nicety that makes an agent "feel" more helpful. It's measurably cheaper to run agents against a codebase whose self-description is true. Every stale reference an agent has to work around, re-derive, or silently get wrong is wasted compute and wasted tokens — on top of the wasted engineer time reviewing and correcting the output.

## Why trust is falling even as adoption climbs

The backdrop makes this more urgent, not less. The 2026 Stack Overflow Developer Survey — 49,000 respondents across 177 countries — found AI coding tool adoption at a record **84%**, while developer trust in the accuracy of that output has fallen to **29%**, down from 40% in 2024. Separately, **96% of developers say they don't fully trust** that AI-generated code is functionally correct, and 71% report never merging AI output without manual review.

That's an unusual, uncomfortable industry position: near-universal adoption, paired with declining confidence. Some of that gap is inherent to probabilistic code generation and won't be solved by better documentation alone. But some meaningful fraction of it is exactly the context rot problem — an agent that's wrong because it was fed a stale map, not because the underlying model got worse. That's the fraction that's actually fixable, and it's fixable with tooling that already exists, not a better model.

## The fix is mechanical, not cultural

Here's the uncomfortable truth about most "keep your docs current" advice: it asks humans to remember to do something tedious, forever, under deadline pressure, with no enforcement mechanism. That's the same failure pattern that produces stale READMEs, and it will produce stale AGENTS.md files for the same reason. Telling a team to "just update the docs when the code changes" has never scaled, whether the reader is a new hire or an AI agent.

`jsdoc-scribe` is built around a different premise: documentation should be a build artifact, not a maintenance obligation. It reads your project's Abstract Syntax Tree via the TypeScript compiler API — used purely as a parser, never a model, so there's no AI in the loop and nothing leaves the build environment — and generates JSDoc comments and a full documentation site from what the code structurally *is*: real parameter names, real types, real return signatures, current as of the last commit that ran the build. Run it in CI on every merge, and the documentation is never more than one build behind reality, by construction rather than by someone remembering.

The `--check-drift` flag is the piece that matters most for this specific problem: it fails a CI check the moment code and generated docs diverge, which is the direct, automatable antidote to context rot. Instead of hoping an AGENTS.md file stays accurate, a drift check makes staleness a build failure instead of a silent, undetectable agent error three weeks later.

## What this looks like in practice

Every `gen-docs` run also produces an **Architecture Insight** page — a plain-English read of your project's folder structure, detected framework, and architecture-pattern signals (layered, monorepo, hexagonal, feature-based, and more), each backed by the concrete evidence that triggered it. That's close to the ideal shape of context for an agent working in an unfamiliar repo for the first time: not a hand-written paragraph someone wrote eighteen months ago and forgot about, but a structural summary regenerated from the actual code on every build. Point an agent's context-gathering step at that output — or just keep it current in the repo where the agent already looks — and the context rot problem shrinks to the size of "how fresh is your last CI run," which is a solvable, observable number instead of an invisible failure mode.

## Bottom line

Context rot isn't a new kind of bug — it's the same documentation-staleness problem the industry has always had, now with a more expensive reader. The AGENTS.md efficiency data shows accurate context is worth real runtime and token savings, and the trust-gap data shows the industry needs that fix more than ever. The way to actually close that gap isn't a reminder to update a file — it's removing the manual step entirely and treating documentation as something a build produces, not something a person remembers.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
