---
slug: shadow-ai-is-a-source-code-problem-first
title: 'Shadow AI Is a Source-Code Problem First: What a Security Review Actually Finds'
description: When security teams go looking for unapproved AI tool use inside engineering, source code is the most commonly exposed data type. Here is what a shadow-AI review actually turns up in 2026, and why some tooling can't appear in the finding at all.
date: 2026-08-05
readingTime: 8 min read
tags: [Security, ShadowAI, EngineeringManagement, CTO, RiskManagement, Documentation]
image: ../assets/shadow-ai-is-a-source-code-problem-first.png
---

# Shadow AI Is a Source-Code Problem First: What a Security Review Actually Finds

Ask a CISO what "shadow AI" means and you'll get a fairly generic answer: employees using AI tools the company hasn't approved, sanctioned, or reviewed. Ask what a shadow-AI review inside an *engineering* org specifically turns up, and the answer gets a lot more concrete — and a lot more uncomfortable. It isn't marketing copy pasted into a chatbot or a sales deck run through a summarizer. It's source code. Proprietary, unreleased, sometimes credential-bearing source code, pasted into a browser tab that reports to a server nobody on the security team approved, retained under terms nobody on the security team read.

This post is about the internal side of that problem — what security and engineering leadership actually find when they go looking inside their own org, not what a vendor questionnaire asks a supplier from the outside. We covered the buyer-side version of this story before, in the piece on why security questionnaires stall deals. This is the mirror image: the internal audit, not the external one.

## The numbers are no longer vague

For a few years, "shadow AI" was a plausible-sounding risk category without much data behind it. That's changed. Multiple independent 2026 sources now converge on the same shape of finding.

More than 59% of security leaders confirm or suspect that employees are using AI tools their IT or security organization has not approved — meaning in most companies, unauthorized AI use isn't a hypothetical, it's an admitted-but-unmeasured baseline. Verizon's 2026 Data Breach Investigations Report puts regular AI use on corporate devices at 45% of employees, up from just 15% the year before — a threefold jump in twelve months, which is a faster adoption curve than security governance has any track record of keeping pace with. And across the shadow-AI research generally, one detail keeps repeating: source code is the data type employees hand over to external GenAI tools most often, ahead of images, spreadsheets, or other structured data.

That last point is the one engineering leadership should sit with. Shadow AI isn't primarily a sales-and-marketing hygiene problem. For engineering orgs specifically, it's a source-code exfiltration problem wearing a productivity-tool costume.

## The case study that still holds up

The most-cited concrete example is still the Samsung incident from 2023: engineers pasted proprietary firmware source code into ChatGPT to help debug it. Weeks later, snippets of that code surfaced in public GitHub gists, and the company banned the tool internally in response. It's a three-year-old story, and the fact that it's still the reference case in 2026 write-ups says something on its own — the underlying failure mode (a developer with a hard problem, a fast unsanctioned tool, and no friction in between) hasn't been meaningfully solved by policy alone since then. Policies got written. Habits didn't fully change, because the review found the leak *after* it happened, not before.

That's the structural weakness in almost every shadow-AI response so far: it's detective, not preventive. A security team runs a review, a CASB flags outbound traffic to a handful of known AI domains, a Slack message goes out reminding everyone of the acceptable-use policy — and six months later the same review finds a slightly different set of tools in use, because the underlying incentive (paste code somewhere fast, get an answer) never went away.

## Why this matters more for internal tooling decisions than it first looks like

Most conversations about AI-and-code-security focus on developers actively choosing to use a chatbot. There's a second, quieter category worth naming: internal developer tooling that calls out to a model *by default*, without the person running it necessarily registering that as "using AI." A documentation generator, a linter, a code-review bot — any of these can be built on top of an LLM API without that being obvious from the product name or the CLI command. If a security review is specifically hunting for "which tools send our code to a model," that category is exactly the kind of thing that gets missed on the first pass, because nobody thought to ask about the doc generator.

This is where the AST-based approach to a task like documentation generation stops being a philosophical preference and becomes a security-relevant design choice. `jsdoc-scribe` uses the TypeScript compiler API purely as a parser — it walks the abstract syntax tree of your code, reads the existing type information, and generates JSDoc comments and a static documentation site from that structure. No model call happens anywhere in that pipeline, ever, by design, not by a configuration toggle that could be silently switched on. Nothing about how the tool works requires a network call. It runs 100% locally, on a developer's machine or inside a CI runner, with your source code never crossing a network boundary to reach it. It has a single runtime dependency (`typescript`) — small enough to actually audit, unlike a tool with a deep dependency tree touching a dozen third-party services.

That distinction matters concretely for a shadow-AI review: a tool with this design *cannot* be the finding. Not "is configured not to be," not "the vendor says it isn't" — structurally cannot be, because there's no code path where your source leaves the machine it's running on. For a CTO or security lead running that internal audit, being able to strike an entire category of tooling off the list without needing to verify vendor claims is a real time save, and a real reduction in what has to be trusted rather than checked.

## What this doesn't fix

To be honest about the scope: a deterministic documentation tool solves exactly one narrow slice of the shadow-AI surface — the doc-generation slice. It does nothing about a developer manually pasting a stack trace into a chatbot, or a well-meaning teammate running a snippet through an AI-powered IDE plugin that phones home by default. Those are real, larger problems that need policy, tooling controls, and probably a CASB or network-level solution, not a JSDoc generator. The point isn't that this one tool solves shadow AI. It's that when you're doing the inventory — the "which of our internal tools could plausibly be leaking code to a model" exercise every security review eventually runs — deterministic, AST-based tooling is one category you get to check off with certainty instead of trust.

## Bottom line

Shadow AI reviews in 2026 are increasingly finding what the data already suggested they would: source code is the thing employees paste into unapproved AI tools most, adoption of those tools tripled in a year, and most security orgs are still working from incident response rather than architectural prevention. Reducing the number of internal tools that can even theoretically be a finding is a small, mechanical way to shrink that surface — not a substitute for the policy work, but a legitimate part of it.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html) &middot; npm: [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) &middot; GitHub: [imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)
