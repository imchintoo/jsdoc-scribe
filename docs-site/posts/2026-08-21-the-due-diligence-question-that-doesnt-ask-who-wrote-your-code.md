---
slug: the-due-diligence-question-that-doesnt-ask-who-wrote-your-code
title: 'The Due-Diligence Question That Doesn''t Ask Who Wrote Your Code'
description: Two independently-run 2026 due-diligence checklists just added the same new category — not who wrote a system, but whether anyone can explain it. Here's what actually answers that question, and why a clean demo stopped being enough.
date: 2026-08-21
readingTime: 7 min read
tags: [DueDiligence, Startups, CTO, Investors, AI, Documentation]
image: ../assets/the-due-diligence-question-that-doesnt-ask-who-wrote-your-code.png
---

Two due-diligence checklists, built independently by two different practitioners, both got a new section this year. Neither borrowed from the other. CTO on Demand's seven-area framework grew an eighth: "Data & AI exposure," whose first line reads, verbatim, *"AI-generated code provenance: how much of the codebase was AI-written, and was it reviewed by someone who understands it? Unreviewed generated code is unaudited code."* Justin McKelvey, a fractional CTO who reviews codebases for a living, added his own eighth item to a separate checklist — "AI-code provenance" — and stated the question behind it more bluntly than anyone else has: *"The diligence question is never 'did AI write this?' It's 'can the people I'm about to pay explain what the AI wrote?' Comprehension is the asset. Code is just its container."*

Two people, working from different client bases, converged on the same new checkbox in the same year. That's usually a sign the underlying problem is real, not a fad.

## Why this is a different question than the ones already on the list

If you've read due-diligence coverage this year, two other AI-era questions probably already sound familiar. One is data flow: does any AI component touch our source or customer data, and where does it go — the question a security questionnaire asks, and the one that's now tangled up with EU AI Act, DORA, and NIS2 obligations depending on the answer. The other is authorship: who's the bus factor of one on each critical system, calculated the old way, via `git blame`.

Both of those questions assume the code is legible once you know the answer. The provenance question doesn't make that assumption. A team can pass the data-flow check cleanly — no AI vendor ever touches customer data — and still fail this one, because the code itself was written by an AI coding agent, merged by someone who reviewed the diff for correctness without holding the whole system in their head. And a team can look fine on bus factor — three engineers all show up in `git blame` for the payments module — while none of them could explain, cold, why a particular retry loop exists or what breaks if a queue backs up. Authorship in `git blame` doesn't mean anything for provenance anymore. Merging isn't the same act as building, and diligence frameworks in 2026 have started pricing that gap directly instead of inferring it from commit history.

McKelvey's phrasing for what accumulates in that gap is "Vibe Debt" — the distance between a codebase that demos perfectly and one where someone present can actually fix it at 2am. He lists "the demo works but the team can't run it locally" and, more specifically, a team unable to walk a diligence engineer through the code they're responsible for, as walk-away signals — not just findings that reprice a deal, but ones that can kill it outright.

## What actually answers "can you explain it"

Here's the practical problem for a team facing this question honestly: comprehension isn't something you can produce on demand for a diligence call. You can't cram a full mental model of a codebase into a week because a term sheet is coming. What you can do is have something that already exists, was generated from the code's actual structure rather than a person's memory of writing it, and can be checked against the current source rather than trusted at face value.

That's a description of documentation — but a specific kind. A wiki page or a stale README doesn't answer this question any better than "trust me, I wrote it" does; a diligence reviewer has no way to confirm a wiki page reflects the code in front of them right now, only that someone typed it once. What answers the provenance question is documentation that's regenerated directly from the code's structure, so that if it's out of date, that's a build failure, not a silent drift nobody notices until the reviewer finds the mismatch themselves.

This is the specific mechanism `jsdoc-scribe` is built around, and it's worth being precise about what it does and doesn't claim to solve. It's AST-based: it uses the TypeScript compiler API purely as a parser, walking a codebase's real structure rather than summarizing from comments or guessing from variable names. Two CLIs cover the two halves of the problem — `gen-comments` generates JSDoc comments directly from that structure, and `gen-docs` builds a full static documentation site from it — alongside a programmatic API and an ESLint plugin for enforcing doc coverage as part of CI rather than as a one-time cleanup pass. It also builds an Architecture Insight page automatically: folder structure, detected frameworks, and structural patterns, derived from the actual repository layout rather than a diagram someone drew for a pitch deck and never updated. A `--check-drift` flag is the piece that matters most for this specific use case — it fails a CI build if the generated documentation would differ from what's committed, which is what turns "the docs describe the code" from a one-time claim into a continuously verified one. Everything runs locally with no AI or LLM calls of its own, it's MIT-licensed and free, and it has a single runtime dependency (`typescript`). An optional `--quality` code-health dashboard is available via the `code-multivitals` peer dependency for teams who want that layered in as well.

## The honest limit of this argument

None of that is a substitute for a human who genuinely understands the system — no tool can manufacture comprehension a team doesn't have, and a diligence reviewer worth their fee will still ask engineers to explain specific decisions out loud, not just point at generated docs and move on. What deterministic, drift-checked documentation actually does is narrower and more useful than that: it gives a reviewer a fast, verifiable starting point for what a system is supposed to do, generated from what the code currently is rather than from anyone's memory, so the conversation with the engineers can start from an accurate baseline instead of from a stale diagram or no diagram at all. Neither CTO on Demand's checklist nor McKelvey's practitioner checklist mentions jsdoc-scribe or any specific documentation tool — the eighth-item framing is theirs; the case that automated, drift-checked documentation is the practical way to keep pace with it is this post's argument, and it should be read as exactly that.

## Bottom line

Two independent 2026 due-diligence frameworks arrived separately at the same new question: not who wrote the code, but whether the people responsible for it can explain what it does. Authorship stopped answering that question when merging a PR and understanding it stopped being the same act. A wiki page never answered it reliably even before that. The version of documentation that does is the kind regenerated from the code itself and checked for drift on every build — which is either something your codebase already has, or something worth having well before the diligence call, not during it.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html) &middot; npm: [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) &middot; GitHub: [imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)
