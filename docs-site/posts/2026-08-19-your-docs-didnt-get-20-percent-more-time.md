---
slug: your-docs-didnt-get-20-percent-more-time
title: 'Your Team Ships 20% More PRs This Year. Your Docs Didn''t Get 20% More Time.'
description: A 2026 benchmark of 50+ engineering leaders found PRs per author up 20% year-over-year and incidents per PR up 23.5% — and named documentation as one of three foundations that separate teams who absorb that safely from teams who don't. What that actually means for an EM's review queue.
date: 2026-08-19
readingTime: 8 min read
tags: [EngineeringManagement, CTO, AI, Documentation, DeveloperExperience, Productivity]
image: ../assets/your-docs-didnt-get-20-percent-more-time.png
---

Cortex surveyed more than 50 engineering leaders and pulled development metrics across multiple organizations for its *Engineering in the Age of AI: 2026 Benchmark Report*. The headline finding won't surprise anyone who manages a team right now: PRs per author are up 20% year-over-year, and deployment frequency is up across the board. AI coding assistants are doing what they were supposed to do — code is getting written faster.

The finding underneath that one is the part worth sitting with. Incidents per pull request are up 23.5%. Change-failure rates are up roughly 30%. Only 45% of organizations have a formal AI usage policy at all, which means more than half are absorbing this shift with no governance layer beyond individual judgment. And when Cortex asked what separated the organizations doing well from the ones accumulating damage, the answer wasn't "which AI tool" or "how much AI usage." It was **strong testing practices, clear service ownership, and robust documentation** — named together, as the three foundations that determine whether more code shipped faster turns into more value or more incidents.

If you're an EM or team lead, that finding has a very specific, uncomfortable shape: your review queue got 20% longer this year, and nothing about that made your reviewers' available context any deeper.

## The part of the loop nobody sped up

AI-assisted coding compresses one stage of the software lifecycle — writing the first draft of the code — and leaves the rest of the pipeline running at its previous speed. A developer with an AI assistant can produce a working implementation faster than they could eighteen months ago. But the PR that implementation lands in still has to be reviewed by a human who wasn't in the room while it was written, tested against a system whose behavior that human still has to reason about, and understood by whoever's on call when it breaks at 2am. None of those downstream stages got 20% faster. They're absorbing 20% more volume at the same speed they always ran at.

Testing and ownership have institutional answers to this pressure already, because they've had to. A test suite is enforced by CI — it either passes or it doesn't, and nobody has to remember to run it. Service ownership is enforced by an org chart and, increasingly, by a catalog tool that pages the right team automatically. Both of those foundations have a structural mechanism keeping them from silently degrading under load.

Documentation, in most engineering orgs, has no equivalent mechanism. It's a wiki page someone wrote eight months ago, a README that describes the module as it existed at initial commit, a set of JSDoc comments that were accurate the day they were typed and have had no reason to be revisited since. Nothing pages anyone when documentation falls out of sync with the code it describes, and nothing blocks a merge because of it. Of the three foundations Cortex names, it's the one most likely to be quietly rotting while the metrics dashboard shows green.

## Why this specifically hits reviewers first

Put yourself in the reviewer's seat for a PR that touches a module you didn't write and haven't touched in months. Before AI-assisted authoring became the norm, that PR probably represented a few hours of the author's own thinking time — time during which they, too, had to re-familiarize themselves with the surrounding code, which meant the PR description and commit history usually carried more implicit context, because the author had just re-derived it themselves. A faster authoring loop doesn't just compress the author's time; it can compress how much of that re-derivation happens at all before code is proposed. The reviewer is left doing more of the context-reconstruction work that documentation is supposed to have already done — at exactly the moment they have 20% more of these reviews to get through.

This is where "robust documentation" as a named foundation stops being an abstract virtue and becomes a specific, measurable input to review throughput: does the reviewer have an accurate, current picture of what a module does and how it fits into the system before they open the diff, or are they reconstructing that picture from the diff itself, every single time, at a volume that's up 20% on last year?

## What "keeping documentation as a real foundation" actually requires

The uncomfortable honest answer is that a wiki-and-good-intentions approach to documentation was already fragile before this shift, and a 20% higher commit rate doesn't make it more sustainable — it makes the gap between what the docs say and what the code does compound faster. The property documentation needs, to function the way tests and ownership already do as a foundation rather than a periodic project, is the same property those two have: it has to be regenerated or re-verified automatically, not maintained by memory.

That's the specific thing `jsdoc-scribe` is built to do, and it's worth being precise about what that claim does and doesn't cover. It's an AST-based tool — it uses the TypeScript compiler API purely as a parser, walking your code's actual structure rather than guessing — with two CLIs (`gen-comments` for generating JSDoc comments, `gen-docs` for building a full static documentation site), a programmatic API, and an ESLint plugin for enforcing doc coverage in CI. It also builds an Architecture Insight page automatically, mapping folder structure and detected frameworks/patterns directly from your `package.json` and directory layout — useful context for exactly the kind of "what does this module do and how does it fit" question a reviewer needs answered before they can review efficiently. A `--check-drift` flag exists specifically to fail a CI build when generated documentation would differ from what's committed, which is the mechanical enforcement layer documentation has historically lacked. It's MIT-licensed, free, has a single runtime dependency (`typescript`), runs entirely locally with no AI or LLM calls in its own pipeline, and an optional `--quality` code-health dashboard is available via the `code-multivitals` peer dependency for teams who want that layered in too.

To be clear about the limits of this argument: Cortex's report doesn't mention jsdoc-scribe, or documentation-generation tooling by name at all. It names documentation broadly as one of three foundations, based on its own survey and metrics analysis. The connection from "documentation is a named foundation" to "therefore automate it the way you already automate testing and ownership enforcement" is this post's argument, not Cortex's — a reasonable one, but worth stating plainly rather than implying the report endorsed a specific tool.

## Bottom line

If your team's PR volume is up 20% this year and your review capacity, headcount, and hours in the day aren't, something in the pipeline has to absorb that difference without silently degrading. Cortex's data says the teams doing this well have testing and ownership on rails, and documentation as a named third leg of that stool. Testing already runs itself. Ownership is already enforced structurally in most orgs with a catalog. Documentation is usually still running on the honor system — and an honor system doesn't scale linearly with a 20% higher commit rate, it scales worse, because there's 20% more of it to forget to update.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html) &middot; npm: [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) &middot; GitHub: [imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)
