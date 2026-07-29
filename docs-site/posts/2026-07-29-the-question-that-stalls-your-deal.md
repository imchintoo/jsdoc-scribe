---
slug: the-question-that-stalls-your-deal
title: 'The Question That Stalls Your Deal: What "Where Does Our Code Go?" Actually Costs You'
description: A security questionnaire is the single biggest cause of stalled B2B SaaS deals in 2026, and the newest line item on it is "does any AI component touch our source." Here is what that question costs a vendor that cannot answer it in one sentence, and what changes when it can.
date: 2026-07-29
readingTime: 7 min read
tags: [Security, Procurement, Compliance, CTO, EngineeringManagement, Documentation]
image: ../assets/preview.svg
---

Every CTO who has sat through a vendor evaluation knows the moment. The demo goes well, the pricing is fine, procurement is ready to move — and then a security questionnaire lands in someone's inbox. Three weeks later, the deal that was supposed to close is still stuck, because nobody on the vendor's side can give a clean, one-sentence answer to "where does our data go once it touches your product."

That's not a hypothetical. According to Vanta's State of Trust Report, **78% of companies report that security reviews caused deal delays in the past year.** This isn't a pricing problem or a product problem. It's a documentation problem — the vendor's own documentation about its own architecture — and in 2026 it has a new, sharper edge: the questionnaire now explicitly asks whether any AI component touches your code.

## Why this question got harder to answer, starting this week

The EU AI Act's high-risk AI system obligations become fully enforceable on **August 2, 2026** — four days from this post. Fines for non-compliance reach up to €35 million or 7% of global annual turnover, whichever is higher. It doesn't arrive in isolation. NIS2 and DORA are already in force, and all three frameworks overlap in ways that stack obligations rather than replace each other: a single vendor relationship can now require a GDPR data processing agreement, a DORA ICT service contract with audit rights and a documented exit plan, a NIS2 supplier security assessment, and — if any AI component is involved anywhere in the pipeline — a separate AI Act due-diligence file on top of all three.

That's four evidence chains for one tool. And the question that determines how many of those chains apply to you is almost always the same one: does this product send our data anywhere, to any third party, ever — and if an AI model is involved, which one, hosted where, trained on what.

## What the questionnaire actually looks like in 2026

Vendor security reviews in 2026 typically run on the Standardized Information Gathering (SIG) framework, scaled to risk: SIG Lite runs roughly 130 questions, the version most SaaS vendors actually encounter lands around 200, and SIG Core — reserved for higher-risk engagements — runs closer to 800. Layered on top of the standard data-governance section (where is data stored, processed, transmitted; does it leave the EEA; who has access) is now a recurring AI-specific block: which components use machine learning or LLM inference, what data is sent to that model, is the model third-party or self-hosted, and can the vendor produce an inventory of every AI system touching customer or source data.

That last point matters more than it sounds. The EU AI Act's foundational requirement — maintaining an inventory of AI systems and their risk classifications — applies from the August 2 date forward, which means procurement teams at regulated buyers are now required to ask, not just permitted to ask, whether a tool uses AI at all. A vendor that has to stop and go find out is not going to close that deal on schedule.

## The actual cost of not having a one-sentence answer

Picture a developer-tooling vendor whose documentation generator quietly calls out to a third-party LLM to summarize code. It's a reasonable product decision on its own terms. But now walk it through a 2026 security review: does source code leave the customer's build environment (yes — it's sent to the LLM provider's API), is that provider under a signed DPA with the vendor (maybe, maybe not, depending on how the integration was procured), is there an AI system inventory entry for it (probably not, if it was added as a convenience feature rather than a governed product decision), and can the vendor produce audit-trail evidence of what was sent and when (usually no, because that wasn't built as a compliance feature).

Every "maybe" or "let me check with engineering" on that list is a week of delay. Multiply across SIG Core's ~800 questions, and it's easy to see how a review that should take days stretches into the three-week stall that kills deal momentum.

## What a deterministic, local-only tool sidesteps by construction

This is the actual argument for architecture, not marketing copy. `jsdoc-scribe` reads a project's Abstract Syntax Tree via the TypeScript compiler API — used purely as a parser, never a model — and generates JSDoc comments and a documentation site from what the code structurally is. There is exactly one dependency (`typescript`), no network calls, and no AI or LLM anywhere in either CLI (`gen-comments`, `gen-docs`), the programmatic API, or the ESLint plugin. The optional `--quality` code-health dashboard runs through `code-multivitals` as a peer dependency — never installed by default, and equally local.

Run through the same questionnaire: does source code leave the build environment — no, by architecture, not by policy. Is there a third-party model in the loop — there is no model in the loop. Does the AI Act's inventory requirement apply to this tool at all — no, because there's no AI system to inventory. That's not a favorable answer negotiated after the fact; it's a fact about how the tool is built, verifiable by reading the single dependency in `package.json`.

For a security or procurement team working through a review, that turns a multi-week data-governance sub-thread into a one-line entry: "no external data transmission; verified via dependency manifest." It doesn't make the rest of the SIG questionnaire disappear — access controls, license compliance, and supply-chain questions are all still real and still worth answering carefully. But it removes the one category of question in 2026 that's most likely to require an escalation, a legal review, and a delay nobody budgeted for.

## Bottom line

The security questionnaire isn't going away, and after August 2, the AI-specific section of it isn't getting shorter. For any tool that touches source code — documentation generators very much included — "does anything leave the build environment, and does anything in the pipeline involve AI" is now a scored, deal-relevant line item, not a footnote. Tools that can answer it in one sentence, backed by an architecture that makes the answer verifiable rather than asserted, clear that section of the review faster. Tools that have to go check are the ones stuck in the 78%.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
