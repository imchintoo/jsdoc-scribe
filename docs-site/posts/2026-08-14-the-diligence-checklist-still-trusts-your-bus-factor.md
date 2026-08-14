---
slug: the-diligence-checklist-still-trusts-your-bus-factor
title: 'The Diligence Checklist Still Trusts Your Bus Factor. AI Just Made That a Bad Bet.'
description: Technical due diligence still treats "bus factor of one" as a valuation red flag, using git-blame authorship as a proxy for who understands a system. Agentic coding has quietly broken that proxy — here's what still works as a comprehension signal once authorship stops meaning anything.
date: 2026-08-14
readingTime: 7 min read
tags: [DueDiligence, Startups, EngineeringManagement, CTO, AI, Documentation]
image: ../assets/the-diligence-checklist-still-trusts-your-bus-factor.png
---

Every technical due diligence checklist still asks some version of the same question: for each critical system, can more than one person operate and extend it? A recent, widely-used 2026 checklist puts it bluntly — "bus factor of one anywhere critical is a valuation problem, not a staffing note." That line has been true, and unremarkable, for years. What's changed is how the number gets calculated, and almost nobody preparing for a raise or an acquisition has updated their mental model to match.

Bus factor — sometimes truck factor, sometimes "degree of ownership" — has always worked the same way. Look at who authored the most code in a file or service, via `git blame`, and infer that person understands it. Losing them means losing the knowledge. That inference held up for decades for a boring reason: writing code by hand forced at least a little comprehension through friction. You couldn't type a retry mechanism without briefly holding its failure modes in your head. Authorship and understanding were bundled by default.

Agentic coding breaks that bundle, and it breaks it silently. An engineer merges a pull request their AI agent wrote — tests pass, coverage is up, the diff is clean — and git still attributes the change to them. The bus-factor calculation still counts them as the expert on that file. None of it is necessarily true anymore, and the tooling has no way of knowing the difference between an engineer who wrote the retry logic and one who approved it on vibes and green checkmarks. This isn't a hypothetical: a [widely-read July 2026 essay](https://medium.com/@guidorusso95/the-bus-factor-lied-to-you-how-ai-quietly-broke-the-oldest-risk-metric-in-software-11bf9b4635b4) on exactly this problem describes the author approving an agent-written PR at 11pm, then being unable to answer a teammate's question about it the next morning — not because the code was wrong, but because merging it and building it had quietly stopped being the same act.

## The checklist's own contradiction

This lands directly on live diligence practice, not just an engineering-culture debate. The same 2026-updated checklist that still flags bus-factor-of-one as a red flag under Team & Key-Person Risk has added a new line item under its Data & AI Exposure section, specific to this year: "AI-generated code provenance: how much of the codebase was AI-written, and was it reviewed by someone who understands it? Unreviewed generated code is unaudited code."

Sit with those two checklist items side by side. One assumes that whoever's name shows up most in `git blame` for a critical file is the person who understands it well enough to be a resilience point. The other implicitly admits that assumption might already be false for a meaningful share of the codebase — because the same AI adoption that's inside most target companies by now is exactly what severs authorship from comprehension in the first place. A diligence team running both checks in the same session is, without necessarily naming it, checking a number and then checking whether that number is trustworthy, in the same document.

For investors and acquirers, this matters on a real timeline: independent technical due diligence typically runs one to three weeks for a venture deal and two to six weeks for complex M&A, priced in the tens of thousands of dollars, specifically because a single missed liability can move the price by millions. A key-person risk finding that's built on a broken proxy doesn't just under- or over-state the company's actual risk — it wastes a meaningful chunk of that window on a signal that isn't measuring what everyone in the room assumes it's measuring.

## What a comprehension signal looks like when it doesn't depend on who typed the code

None of this means bus factor should be abandoned — team knowledge concentration is still a real risk. It means the *input* to that risk assessment needs to stop being purely who committed the most lines. The more durable version of the same question is: can someone who did **not** write a given piece of code still produce an accurate, checkable account of what it does and how the pieces connect — and does that account get invalidated automatically the moment the code changes underneath it?

That's a narrower, more mechanical question than "comprehension," and it's the one deterministic tooling can actually answer, which is the whole premise behind `jsdoc-scribe`. It reads a project's TypeScript/JavaScript AST — using the TypeScript compiler purely as a parser, not a model — and writes real JSDoc comment blocks and a generated documentation site directly from that structure. Nothing is inferred, guessed, or generated by a language model; nothing leaves the machine or CI runner it runs on. Two things about it are specifically relevant to a diligence conversation rather than a developer one.

First, its `--check-drift` flag fails a CI run the moment an existing JSDoc block no longer matches the function's actual signature — which means "the docs still describe the system" is a build-verifiable claim, not something a reviewer has to trust because a person said so. Second, its automatically-generated Architecture Insight page renders folder structure, framework signals, and pattern detection straight from the codebase, independent of who authored which file — a diligence reviewer, or a new engineer, or an acquirer's technical evaluator gets the same account of the system whether the original author is in the room or not. Neither of these is a claim that jsdoc-scribe measures comprehension directly — it doesn't, and no tool honestly can yet. What it does is remove one variable from the equation: whether the documentation a reviewer is reading was true as of five minutes ago, regardless of who wrote the code underneath it.

## What this doesn't fix

To be honest about the limits here: generated, drift-checked documentation tells a reviewer whether the system's shape is accurately described. It does not tell them whether the one engineer who reviewed the AI-generated retry logic actually understood the failure modes, or just approved a clean diff at 11pm. That's still a people question, and the essay above is right that it needs a people-side fix — reviewers explaining changes back in their own words, comprehension duty rotated deliberately rather than defaulting to whoever's git-blame percentage is highest. A documentation tool is one input to a diligence process, not a replacement for the judgment calls that process still requires.

## Bottom line

Bus factor isn't wrong as a question. It's the authorship-based way of answering it that's quietly stopped working, at the exact moment 2026 diligence checklists are adding a second line item that half-admits it. Whatever else changes in how due diligence gets run this year, the documentation a reviewer is handed should at minimum be verifiably current — checkable in CI, not dependent on trusting whoever's name is on the commit.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

More on the [docs site](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), the [npm package](https://www.npmjs.com/package/jsdoc-scribe), and the [GitHub repo](https://github.com/imchintoo/jsdoc-scribe).
