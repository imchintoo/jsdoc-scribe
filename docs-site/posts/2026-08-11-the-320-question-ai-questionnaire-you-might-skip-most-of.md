---
slug: the-320-question-ai-questionnaire-you-might-skip-most-of
title: 'The 320-Question AI Questionnaire You Might Skip Most Of'
description: CSA's AI-CAIQ v1.1 adds 320 AI-specific self-assessment questions on top of the base CAIQ. Here is the applicability test that determines how many of them actually apply to a given tool, and why a "no AI" architecture answers a whole cluster with one fact.
date: 2026-08-11
readingTime: 8 min read
tags: [Security, Compliance, AIGovernance, Procurement, CAIQ, Documentation]
image: ../assets/the-320-question-ai-questionnaire-you-might-skip-most-of.png
---

Every security or procurement lead who's already survived a CAIQ or SIG cycle this year is about to meet a second one. The Cloud Security Alliance shipped its AI Controls Matrix v1.1 on June 23, 2026 — 247 controls across 18 domains, including a new Model & Data Security domain — with a companion self-assessment questionnaire, AI-CAIQ v1.1, running **320 questions**. It's not a revision of the CAIQ you already know. It's a separate, additional layer, aimed specifically at any vendor whose product touches AI anywhere in its pipeline. The base CCM/CAIQ track moved independently to v4.1 in the same window (207 controls, 283 questions), with the older v4.0.x staying valid for STAR submissions only until January 2028.

We mapped the general CAIQ v4 domains to `jsdoc-scribe`'s facts a few weeks ago in [Answering the Security Questionnaire, Line by Line](./answering-the-security-questionnaire-line-by-line.html). That mapping still holds. This post covers the part it didn't, because AI-CAIQ didn't exist yet when it was written: the new AI-specific layer, and — more usefully than a line-by-line answer key — the applicability test that determines how much of it you actually have to fill in.

## The question before the questionnaire

Most teams handed AI-CAIQ for the first time skip straight to answering it. That's the wrong first step. AI-CAIQ's own structure, per CSA's FAQ, is built around a self-assessment of AI-specific controls — governance, security, privacy, and operational resilience for systems that develop, implement, or operate AI technologies. The first real question isn't "how do we answer question 47," it's "does this questionnaire apply to us at all, and if it partially applies, which sections."

That distinction matters because AI-CAIQ isn't scoped to companies building foundation models. It's scoped to any vendor whose product has an AI system in it anywhere — including a feature that quietly calls an LLM API to "summarize" or "explain" something, added as a convenience rather than a headline capability. A tool doesn't need to market itself as AI-powered to trigger the applicability question. It needs an actual AI system somewhere in its architecture, full stop, and the burden is on the vendor to know the difference and say so accurately.

## Where the new questions actually live

AI-CAIQ v1.1's 320 questions map 1:1 to AICM's 247 controls, each with mandatory YES/NO/NA fields, SSRM (Shared Security Responsibility Model) ownership tagging per question, and recommended free-text evidence covering both what the vendor implements and what the customer is responsible for. The domain most relevant to a documentation or developer-tooling vendor is the new **Model & Data Security (MDS)** domain, which asks about things the base CAIQ never touched: training-data provenance and lineage, model versioning and change management, data used for fine-tuning or evaluation, and whether model outputs are logged, retained, or used to further train anything.

Every one of those questions assumes there's a model in the loop to answer questions about. For a tool with no model in the loop, the honest answer to a large block of MDS questions isn't a careful, hedged explanation — it's "not applicable," stated plainly, because there's no training pipeline, no model version, and no output-logging system for a model that doesn't exist in the product.

## What "not applicable" actually requires to be true

Here's where a vague "we don't really use AI" answer falls apart under an actual audit, and where the distinction has to be architectural, not aspirational. `jsdoc-scribe` reads a project's Abstract Syntax Tree via the TypeScript compiler API — used strictly as a parser, the same mechanism TypeScript itself uses to type-check code, never a model of any kind. Both CLIs (`gen-comments`, `gen-docs`), the programmatic API, and the ESLint plugin share that same architecture: one runtime dependency (`typescript`), zero network calls, deterministic output — same input, same output, every run. The optional `--quality` code-health dashboard runs through `code-multivitals` as a peer dependency, also local, also model-free.

That's what makes "not applicable" a fact rather than a claim: there is no code path anywhere in the product that calls a model, trains on data, or logs a model's output, so there's nothing for the MDS domain's questions to be asked about. It's the same property the EU AI Act inventory question turned on back in [The EU AI Act Deadline Passed Yesterday](./eu-ai-act-a-day-later-what-actually-changed.html) — an AI system inventory only needs an entry for systems that exist, and a tool that's verifiably non-AI by architecture doesn't get one, checkable by reading a single dependency line in `package.json` rather than trusting a vendor's assurance.

## What still applies, even for a tool with no AI in it

Being direct about scope: AI-CAIQ isn't entirely skippable just because a product has no model. Governance-domain questions about whether the vendor has an AI usage policy, whether AI is used anywhere in the vendor's own internal development or support processes, and whether third-party AI tools touch customer data indirectly (through a support ticketing system, for instance) are organizational questions, not product-architecture ones — and they still need real answers, not a blanket "not applicable" applied too broadly. Answering AI-CAIQ honestly means separating "our product has no AI system" (an architectural fact, verifiable) from "our company never touches AI anywhere in its operations" (a broader claim that needs its own real answer, and is usually not simply "no").

## Why this is worth doing now rather than when it's requested

AI-CAIQ is six weeks old as of this post. Most vendors evaluating a documentation or dev-tooling product haven't been asked to fill it out yet, which means most vendors also haven't pre-mapped their own answers the way the base CAIQ mapping already exists for. That gap is temporary — AI-specific vendor risk questions are the fastest-growing section of security review in 2026, the same trend covered in [The Question That Stalls Your Deal](./the-question-that-stalls-your-deal.html) — and the vendors who show up to that first AI-CAIQ request with a pre-written, architecture-grounded answer instead of a scramble are the ones who don't lose the two or three weeks that section can otherwise cost.

## Bottom line

AI-CAIQ v1.1 adds 320 new questions to an already long review process, but the number that matters more than the count is the applicability test underneath it: a product with no model anywhere in its pipeline doesn't answer most of the Model & Data Security domain carefully, it answers it once, structurally, and moves on. The organizational-governance questions still need real answers regardless of architecture. For the product-level questions specifically, the fastest way through a 320-question form is a tool built so that most of them were never really about it in the first place.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
