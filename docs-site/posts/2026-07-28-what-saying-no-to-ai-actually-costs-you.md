---
slug: what-saying-no-to-ai-actually-costs-you
title: 'What Saying No to AI Actually Costs You (And What It Saves)'
description: jsdoc-scribe is built to never call an LLM. That is an easy line to sell and a harder one to defend honestly — here is the real trade-off, costs included, for founders, CTOs, and engineers who are skeptical of both sides of the AI argument.
date: 2026-07-28
readingTime: 6 min read
tags: [AI, DeveloperTools, EngineeringManagement, Security, Documentation]
image: ../assets/what-saying-no-to-ai-actually-costs-you.svg
---

Most vendor pitches about "no AI" stop at the applause line: your code never leaves your machine, there's no hallucination risk, nothing to disclose in a security review. All true, and all things we've said on this blog before. What we haven't done yet is argue the other side of it — what you actually give up when a tool refuses to touch a model, and whether that trade is still worth it once you look at it honestly instead of as a selling point.

It's worth doing because the audience that matters most here — CTOs deciding what to standardize on, founders answering a due-diligence question about AI usage, and engineers who've watched two years of AI hype without fully buying either the utopian or dystopian version — doesn't respond well to a pitch that only lists upside. So here's the actual accounting.

## What refusing AI costs you

Start with the honest downside, because it's real. `jsdoc-scribe` reads your code's Abstract Syntax Tree via the TypeScript compiler API and generates JSDoc blocks from what's structurally true: parameter names, types, return signatures. It cannot, and by design will not, generate a plain-English sentence explaining *why* a function exists or *what business problem it solves* — the kind of narrative summary an LLM can produce by pattern-matching against millions of similar functions it's seen before.

Concretely, that means:

**No free narrative summarization.** If a function is named `reconcileLedgerDelta`, jsdoc-scribe will document its parameters and return type accurately. It will not infer that this exists because finance asked for a nightly reconciliation job after a Q3 incident — that context lives in a commit message or a Slack thread, not the AST, and no deterministic parser can recover it.

**More manual work on genuinely ambiguous code.** A parameter named `flag: boolean` gets documented as exactly that — a boolean parameter named flag. An AI-based tool might guess "whether to enable strict mode" from surrounding context and sometimes be right. jsdoc-scribe will never guess, which means the placeholder text (`TODO: describe parameter "flag"`) is honest but still requires a human to fill it in.

**Slower on first pass for legacy code with cryptic naming.** Codebases with `x1`, `tmp2`, `doStuff()` don't get magically clarified. The AST tells you the literal shape of the code, not a cleaned-up interpretation of what the original author probably meant.

If your priority is "get plausible-sounding docs across a messy legacy codebase as fast as possible with minimal human review," an AI-assisted tool will beat jsdoc-scribe on raw speed to a first draft. That's not spin — it's a real, specific advantage the other category has, and pretending otherwise doesn't help anyone make a good decision.

## What you get back

The trade for that lost narrative capability isn't abstract, and 2026's data makes it more concrete than it would have a year ago.

A widely-cited Snyk analysis of 500 organizations using AI coding tools found that 47% had not reviewed the privacy implications of their primary tool before adopting it, and 23% later discovered the tool's data handling violated their own internal policy or a customer commitment — after the fact, not before. Separately, "shadow AI" — engineers running proprietary code through personal AI accounts with no security team visibility — is now being described as 2026's version of shadow IT: same pattern of unauthorized tool sprawl, higher stakes because the payload is your source code.

Layer onto that a second, less-discussed number: adoption of AI coding tools is now close to universal — 95% of developers report using them at least weekly — but trust hasn't followed. Distrust of AI code-assistant output is reported as the single greatest challenge to working with AI in the development workflow by two-thirds of developers surveyed. Near-total adoption without proportional confidence is an unusual, uncomfortable position for an entire industry to be in, and it's exactly the gap a deterministic tool sidesteps by construction: there's no output to distrust because there's no generation step guessing at intent, only extraction of what's structurally there.

For `jsdoc-scribe` specifically, that non-AI design isn't a marketing constraint bolted on after the fact — it's the entire architecture. One dependency (`typescript`, used purely as a parser), zero network calls, same input always produces the same output. There's nothing to review in a security assessment because there's nothing leaving the build environment to review. No model version bump can silently change what your documentation says between builds, because there's no model in the loop to bump.

## Where the honest line actually sits

The trade-off resolves differently depending on what you're optimizing for, and pretending it doesn't is the dishonest version of this argument:

If you need documentation that explains *intent and business context* across a codebase nobody has time to annotate by hand, and you've already done the privacy diligence on your AI tool of choice, an AI-assisted generator is doing something jsdoc-scribe structurally cannot. That's a legitimate use case, not a strawman.

If you need documentation that's guaranteed accurate to what the code *actually does*, generated at zero ongoing review cost, with no data-handling policy to audit and no risk of a model hallucinating a plausible-but-wrong description into a reference doc your team then trusts — that's the case deterministic tooling is built for, and it's the harder property to get from a probabilistic system by definition, not by vendor claim.

Most teams actually want both, at different layers: structural accuracy (params, types, returns, drift detection) handled deterministically and continuously, with narrative context added deliberately by humans where it earns its cost — a PR description, an ADR, a README section someone actually thought about. `jsdoc-scribe` is built for the first layer, not as a replacement for the second, and any pitch that implies otherwise is overselling it.

## The bottom line

"No AI" is not automatically the responsible choice, and "AI-assisted" is not automatically the risky one — the honest answer depends on what you're generating and what happens to your code while you generate it. What deterministic tooling buys you is certainty: the same input produces the same output, nothing leaves your infrastructure, and there's no privacy review to schedule because there's no external call to make. What it costs you is narrative intelligence you'll still need to supply by hand. For structural documentation — the part that goes stale the fastest and matters most for onboarding, drift detection, and due diligence — that trade has been worth it for the teams already running it. Whether it's worth it for the parts of your docs that need real narrative judgment is a separate question, and the honest answer is: probably not, and that's fine, because that was never the job it was built for.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
