---
slug: the-one-slice-of-ai-pr-review-docs-can-shrink
title: 'Your PR Review Queue Is Up 441%. Here''s the One Slice Generated Docs Can Actually Shrink.'
description: LinearB's 2026 benchmarks put a number on the AI-code review slowdown — agentic PRs wait 5.3x longer for reviewer pickup. Faros's data shows why. A worked example of exactly which part of that time generated documentation removes, and which part it explicitly doesn't.
date: 2026-08-25
readingTime: 8 min read
tags: [AI, CodeReview, DeveloperExperience, EngineeringManagement, Documentation, DeveloperTools]
image: ../assets/the-one-slice-of-ai-pr-review-docs-can-shrink.png
---

LinearB's *2026 Software Engineering Benchmarks Report* pulled data from 8.1 million pull requests across 4,800 teams and found that agentic AI-generated PRs sit in the queue for 1,055 minutes before a reviewer even picks them up — 5.3x longer than unassisted PRs at 201 minutes. Those same PRs are also 2.6x larger at the 75th percentile: 408 lines versus 157. Faros's *AI Engineering Report 2026*, drawn from a separate telemetry set of 22,000 developers, tells the same story from a different angle: under high AI adoption, median time in PR review is up 441.5%, bugs per PR are up 54%, and — the number that should worry anyone running a team — 31.3% more PRs are getting merged with no review at all.

Two independent datasets, same shape: code is being written faster than it can be checked, and the checking step is where the slack is disappearing.

## What a reviewer is actually stuck doing

It's worth separating two things reviewers do that get lumped together as "code review," because they don't respond to the same fix.

The first is verifying whether the new logic is correct — does this function do what it's supposed to, does it handle the edge cases, does it introduce a bug. That's the part most of the 2026 tooling response is aimed at: AI-reviews-AI tools, static analysis, and what Faros calls "context engineering" (feeding the coding agent repo history and architectural patterns before it writes anything, so the first draft is closer to right). Faros's own data shows this helps — a weaker model with good repo context outperformed a stronger model without it on their correctness benchmark, going from -0.34 to +0.08.

The second is something quieter and, going by the numbers, more expensive: figuring out what the *surrounding* code — the code the PR didn't touch — already does, so you can judge whether the new code fits it correctly. A product designer quoted in Faros's writeup put it bluntly: "AI agents do not pause when requirements are vague. They do not challenge undefined behavior. They fill the gap and compile the guess." When that guess lands in a PR, the reviewer is the one who has to reconstruct what the gap actually was — what the module was for, what else calls it, what invariant it was quietly relying on — before they can tell whether the AI's guess was a reasonable one. Faros calls this "product archaeology," and it's explicitly not something a linter, a static analyzer, or an AI-review-AI tool touches, because none of them know what the code was *for* — they can only check what it *does*.

That's the slice generated documentation actually addresses. Not correctness. Context.

## A worked example

Say an AI agent gets a ticket to add retry logic to a queue consumer, and the PR adds this:

```ts
async function processWithRetry(job: QueueJob, opts: RetryOptions) {
  for (let i = 0; i <= opts.maxAttempts; i++) {
    try {
      return await consumer.process(job);
    } catch (err) {
      if (i === opts.maxAttempts) throw err;
      await sleep(opts.backoffMs * 2 ** i);
    }
  }
}
```

Syntactically, it's clean. It compiles, it has a test for the happy path and one for max-retries-exceeded, and on its own it looks like exactly the ticket asked for. The question a reviewer actually has to answer isn't "is this loop correct" — it's "does calling `consumer.process` twice ever cause a problem I can't see from this diff." That depends entirely on code this PR doesn't include: does `consumer.process` have side effects that aren't idempotent, is it already wrapped in its own retry somewhere upstream, does anything else in the codebase assume `process` is called exactly once per job.

Without documentation, answering that means opening `consumer.ts`, reading through however many methods it has, grepping for other callers of `process`, and cross-referencing what each of *those* call sites assumes — reconstructing a mental model of a module you didn't write, from source, under time pressure, for every PR that touches something adjacent to code you don't already carry in your head. That reconstruction time is exactly what LinearB and Faros are both measuring when review time balloons — it's not that reviewers got slower at reading loops, it's that AI-authored PRs increasingly touch code the reviewer has no standing context for, at a volume that used to be gated by how fast a human could write the surrounding changes too.

With an accurate, current JSDoc block on `consumer.process` — its actual parameter contract, its return type, a note on idempotency if one was ever written — plus a generated Architecture Insight page showing what else in the codebase imports `QueueConsumer`, that same question gets answered by reading two things instead of tracing a module cold. The reviewer still has to think about whether double-processing is a real risk. They just don't have to spend fifteen minutes rebuilding the map of the system before they can start thinking about it.

## What this doesn't fix

It's worth being precise about the boundary here, because overclaiming this would be dishonest in exactly the way the underlying research warns against. Generated documentation does not verify that `processWithRetry`'s logic is correct — it doesn't run the code, doesn't catch the off-by-one in a backoff calculation, doesn't know that `maxAttempts` should probably never be zero. That's still the reviewer's job, and it's the job Faros's context-and-harness-engineering framework is aimed at improving upstream, before the PR is even opened. Documentation and context engineering are solving adjacent problems, not competing solutions to the same one.

What `jsdoc-scribe` is built to keep true is the half that's derivable from source: it walks a project's AST via the TypeScript compiler API — used strictly as a parser, no AI or LLM calls anywhere in its own pipeline, 100% local — to generate JSDoc comments (`gen-comments`) and a documentation site with an automatic Architecture Insight page (`gen-docs`). The reason this stays reliable enough to actually save a reviewer time, rather than becoming one more stale wiki page, is the `--check-drift` flag: it re-parses the AST and fails CI if the committed docs no longer match the code, so a reviewer who opens the generated page isn't taking on faith that it's current — the build already checked. It's MIT-licensed, free, and has exactly one runtime dependency.

## Bottom line

The industry's 2026 response to slower AI-code review has mostly targeted correctness — better context at generation time, AI agents reviewing AI output, harness engineering to catch mistakes before a human sees them. All of that is worth doing, and none of it answers the question a reviewer actually opens a PR asking first: what does the code around this already do. That's a narrower, more mechanical problem, and it's one an AST can answer honestly without guessing — which is the one thing, per Faros's own data, the rest of this pipeline currently can't stop doing.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html) &middot; npm: [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) &middot; GitHub: [imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)
