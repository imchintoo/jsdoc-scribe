---
slug: answering-the-security-questionnaire-line-by-line
title: 'Answering the Security Questionnaire: A Line-by-Line Guide for Docs Tooling'
description: A reference for security and procurement teams evaluating jsdoc-scribe against CAIQ and SIG — mapped domain by domain to specific, verifiable answers, ready to paste into an actual vendor review.
date: 2026-08-07
readingTime: 9 min read
tags: [Security, Procurement, Compliance, CAIQ, SIG, Documentation]
image: ../assets/answering-the-security-questionnaire-line-by-line.png
---

Most posts about security questionnaires talk about why they're painful. This one skips that and just answers them. If you're a security reviewer, procurement lead, or the engineer who got handed a CAIQ or SIG spreadsheet and told to "fill in the parts about our doc tooling," this is meant to be pasted from, not read for context.

Two frameworks dominate vendor risk review in 2026. The Cloud Security Alliance's **CAIQ** (Consensus Assessments Initiative Questionnaire) runs 259–261 yes/no questions across 17 domains in the Cloud Controls Matrix, with a **CAIQ Lite** variant at 73 questions covering the same domains at lower depth. Shared Assessments' **SIG** scales further — SIG Lite around 150 questions, full SIG/SIG Core into the hundreds — across 18 risk domains, and its 2026 revision adds expanded AI-governance and privacy content on top of the existing set. Neither framework has a category for "documentation generator," so a tool like `jsdoc-scribe` gets routed through the same generic data-handling and third-party-risk questions as any SaaS vendor, even though most of the actual answers are short and structural rather than policy-dependent.

Below is that mapping, organized by the domain groupings both frameworks share.

## Data Security

| Typical question | Answer |
|---|---|
| Does the product transmit customer/source data to any external system, API, or third party? | No. `jsdoc-scribe` performs all parsing and generation locally, on the machine or CI runner where it's invoked. There is no outbound network call in either CLI (`gen-comments`, `gen-docs`), the programmatic API, or the ESLint plugin. |
| Is data encrypted in transit to/from the vendor's systems? | Not applicable — there is no transit. Nothing leaves the local environment, so there's no transmission channel to encrypt. |
| Where is data stored, and for how long is it retained? | Nowhere outside the customer's own filesystem or repository. `jsdoc-scribe` has no hosted storage, database, or retention policy of any kind because it holds no data after a run completes. |
| Does the vendor have access to customer production data? | No. The tool is installed as a dependency and run by the customer; the vendor (the package maintainer) never receives an execution log, a code sample, or any other artifact from a customer's run. |

## Application & Interface Security

| Typical question | Answer |
|---|---|
| How does the product parse or process source code — via static analysis, AI/ML inference, or another method? | Static analysis only. `jsdoc-scribe` reads a project's Abstract Syntax Tree using the TypeScript compiler API, used strictly as a parser — the same mechanism TypeScript itself uses to type-check code, not a model of any kind. |
| Are there API endpoints exposed by the product that could be attack surface? | No. There is no server component, no API endpoint, and no listening process. The tool runs to completion and exits. |
| What is the dependency footprint, and has it been audited? | One runtime dependency: `typescript`. That's small enough to review directly rather than trust a vendor's attestation about a deep, opaque dependency tree. |

## Supply Chain & Third-Party Risk

| Typical question | Answer |
|---|---|
| Does the product rely on any third-party AI/ML model providers (OpenAI, Anthropic, etc.)? | No. There is no AI or LLM component anywhere in the product, by design — not a configuration option that happens to be off by default, but an architecture with no code path that calls a model. |
| List all subprocessors involved in delivering this product. | None. There is no hosted service, so there is no subprocessor chain to disclose. |
| Is the product open source, and can its behavior be independently verified? | Yes. MIT licensed, source available on GitHub, and the single dependency is visible in `package.json` — the "no external calls" claim above is checkable by reading the code, not something to take on faith from a sales page. |
| What is the vendor's incident response process for a supply-chain compromise (e.g., of the `typescript` dependency itself)? | Standard npm dependency hygiene applies: `jsdoc-scribe` pins compatible `typescript` version ranges and customers control their own lockfile and update cadence, same as any other npm dependency in their tree. This is a reasonable question to ask of any single-dependency package, and the honest answer is that the attack surface is exactly one well-known, heavily audited compiler package — not a differentiator unique to this tool, but a smaller surface than most alternatives with deeper dependency trees. |

## AI Governance (2026 revision — new section on both frameworks)

This is the section that's new enough that most vendors don't have a pre-written answer for it yet, and it's worth answering plainly rather than vaguely.

| Typical question | Answer |
|---|---|
| Does this product use AI or machine learning in any part of its function? | No. |
| If yes, is it covered by an AI system inventory as required under applicable AI governance regulation (e.g., EU AI Act)? | Not applicable — there is no AI system in this product to inventory. |
| Does the product make automated decisions affecting the customer's data or systems? | No. Output (generated comments, documentation pages, quality metrics) is deterministic — the same input code produces the same output every run, and nothing is inferred, guessed, or probabilistically generated. |
| Is there a human-in-the-loop requirement or override for AI-generated output? | Not applicable — the tool doesn't generate content probabilistically, so there's no AI output requiring human review by category. (Reviewing generated docs for accuracy is still good practice, same as reviewing any generated artifact — but it's a code-review habit, not an AI-safety control.) |

## Identity & Access Management, Business Continuity

These two domains are usually the fastest to clear for a tool with this architecture, and worth stating directly rather than leaving blank: `jsdoc-scribe` has no accounts, no authentication system, and no hosted infrastructure, so IAM and business-continuity questions framed around vendor-hosted systems (SSO support, uptime SLA, disaster recovery plan) largely don't apply — there is no vendor-operated system to authenticate into or fail over. The relevant continuity question is really "does the customer's own CI/build pipeline keep working," which is governed by the customer's own infrastructure, not this dependency.

## What this doesn't cover

Being direct about scope: this reference answers the data-handling and AI-governance questions that a doc-generation tool's *architecture* determines. It does not answer questions specific to a customer's own deployment — license compliance in their broader stack, their own access controls around who can run CI jobs, or their internal policy for reviewing generated output before merge. Those stay the customer's responsibility, same as they would with any dependency. A clean answer on the data-egress and AI sections of a questionnaire narrows the review; it doesn't eliminate it.

## Bottom line

The value of a mapping like this isn't that it makes a security review disappear — access controls, license terms, and internal process questions are still real and still worth answering carefully. It's that the highest-friction section of a 2026 questionnaire — data egress and AI involvement — collapses to short, structural, verifiable answers for a tool built this way, instead of requiring a legal escalation or a "let me check with engineering." If you're filling out a CAIQ or SIG response right now and `jsdoc-scribe` is one of the line items, the tables above should cover most of it directly.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
