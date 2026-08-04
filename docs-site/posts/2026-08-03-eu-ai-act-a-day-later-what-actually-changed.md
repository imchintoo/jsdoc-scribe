---
slug: eu-ai-act-a-day-later-what-actually-changed
title: 'The EU AI Act Deadline Passed Yesterday. Here''s What Actually Changed.'
description: The EU AI Act's high-risk obligations became enforceable on August 2, 2026. A day later, here is what genuinely went live, what was widely misreported in the run-up, and the one-week test most engineering orgs would fail if a regulator asked today.
date: 2026-08-03
readingTime: 7 min read
tags: [Compliance, CTO, RiskManagement, AIGovernance, EngineeringManagement]
image: ../assets/eu-ai-act-a-day-later-what-actually-changed.png
---

Yesterday was the date every compliance newsletter had circled for months: August 2, 2026, when the EU AI Act's high-risk obligations became enforceable. Annex III high-risk AI system requirements, Article 50 transparency obligations, conformity assessment procedures, CE marking, and the AI Office's enforcement powers all went live at once. It's the single biggest activation point in the Act's rollout so far, alongside NIS2 and DORA obligations that are already in force and stack on top of it rather than replacing it.

Now it's the day after. Nothing dramatic happened at midnight — no mass enforcement wave, no sudden shutdown notices. But the run-up to this date produced a specific, widely repeated claim that's worth correcting now that the actual rules are in effect, because getting it wrong changes what an engineering org should actually be doing this week.

## The claim that needs correcting

In the weeks before August 2, it was common to hear — including in coverage on this blog — that the Act requires organizations to maintain a formal inventory of their AI systems, as of the enforcement date. That's not quite what the text says. Looking at the rules that actually took effect: neither Article 5, nor Article 50, nor the Commission's guidelines contain an explicit obligation to keep a written inventory list. There's no line in the statute that says "you must maintain a document titled AI System Inventory."

That distinction matters, but not in the direction that makes anyone's job easier.

## Why the absence of a formal rule doesn't mean the absence of real exposure

Here's the part that got lost in translation on the way to enforcement day: if a national market surveillance authority has sufficient reason to consider that an AI system presents a risk, it can open a formal evaluation — and during that evaluation, the burden of proof sits with the organization, not the regulator. There's no statutory requirement to have already written the inventory down in advance. There is a very real practical requirement to be able to produce one, with owners and purposes, fast, the moment someone asks.

The test that actually matters, then, isn't "do we have a compliance document called an AI inventory." It's this: **can your organization produce a list of every AI system in use, who owns each one, and what it's used for, inside a week?** Most organizations can't — and it's rarely because the policy doesn't exist. It's because a meaningful share of their actual AI usage is invisible to whoever would have to compile that list.

## Where the invisible usage actually lives, for an engineering org specifically

This is the part that's easy to miss if "AI Act compliance" gets treated as a legal-team project rather than an engineering one. The AI systems most likely to be missing from a hastily-assembled inventory aren't the ones procurement signed a contract for — those are already documented somewhere. They're the ones that entered the stack informally:

- A code review bot with an LLM behind it, added by one team without a formal procurement request
- A documentation generator that quietly calls out to a third-party model to "summarize" code
- A browser extension or IDE plugin an individual engineer installed that sends snippets to an external API
- A support-ticket triage tool that was evaluated in a trial and never fully turned off

None of these show up in a vendor contract list. All of them are AI systems touching the organization's data, and all of them are the kind of thing that turns "we can produce an inventory in a week" into "we need three more weeks and a very uncomfortable set of Slack threads," if a regulator's evaluation ever actually asks.

## Why deterministic tooling is a smaller version of the same argument, applied to one specific tool category

This isn't a reason to panic about documentation generators specifically — but it is a reason to actually check, rather than assume, whether the ones in your stack use a model at all. `jsdoc-scribe` reads a project's Abstract Syntax Tree via the TypeScript compiler API, used purely as a parser, never a model. One dependency (`typescript`), no network calls, no AI or LLM anywhere in either CLI, the programmatic API, or the ESLint plugin. Whether a tool like this belongs on an AI system inventory isn't a judgment call or a vendor's marketing claim to take on faith — it's answerable by reading a single line in `package.json`.

That's a small, boring example, but it's the right shape of the actual exercise every engineering org now has reason to run: for each tool touching source code or customer data, is there a model involved, and can that be verified rather than assumed. Tools built to be verifiably non-AI clear that check in seconds. Tools where the honest answer is "I'd have to ask the vendor" are exactly the entries that turn a one-week inventory request into a much longer one.

## What to actually do this week

Skip the instinct to treat this as a legal-only exercise. A useful first pass, doable by an engineering lead in an afternoon: list every developer tool, SaaS product, and browser extension in active use that has "AI," "LLM," "Copilot," or "intelligent" anywhere in its own marketing description. For each one, note whether it touches source code or customer data specifically, and whether that data leaves your infrastructure. That list — however incomplete — is a far better starting position than having nothing when the question eventually gets asked, and it's the actual work the "one week" test is measuring, whether or not a formal inventory document is legally mandated.

## Bottom line

The EU AI Act's high-risk obligations are now genuinely in force, not hypothetically upcoming — that part of the pre-deadline coverage was accurate. What needed correcting is narrower but more actionable: there's no explicit statutory line requiring a written AI inventory, but the practical bar — produce one, with owners and purposes, inside a week, burden of proof on you — is arguably a higher standard to actually meet than a checkbox would have been. For engineering orgs specifically, the gap between "we have a policy" and "we can produce the list" almost always lives in tools nobody formally procured, which is exactly why it's worth checking now, a day after the deadline, rather than waiting for a regulator to ask first.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
