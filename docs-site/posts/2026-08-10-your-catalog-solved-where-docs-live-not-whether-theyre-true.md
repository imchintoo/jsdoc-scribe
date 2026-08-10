---
slug: your-catalog-solved-where-docs-live-not-whether-theyre-true
title: 'Your Software Catalog Solved Where Docs Live. It Didn''t Solve Whether They''re True.'
description: Backstage TechDocs and its peers fixed where documentation lives — co-located with code, reviewed in the same PR. That never guaranteed anyone updates it. Here is the staleness gap platform teams are standardizing into their catalogs, and the mechanical fix for it.
date: 2026-08-10
readingTime: 7 min read
tags: [PlatformEngineering, DevOps, EngineeringManagement, Documentation, Backstage, DeveloperExperience]
image: ../assets/your-catalog-solved-where-docs-live-not-whether-theyre-true.png
---

Gartner now puts the number at over 80%: that's the share of software engineering organizations with a dedicated platform team, up sharply from a few years ago. Roughly three-quarters of those teams ship a self-service developer portal — Backstage, still the open-source default and now a CNCF incubating project, or a commercial option like Port or Cortex. Every one of them ships the same core primitive: a software catalog, and inside it, a docs tab.

That's real infrastructure, and it solved a real problem. Before catalogs, "where's the documentation for this service" had no consistent answer — a README that might be current, a Confluence page that probably wasn't, a Slack thread somebody bookmarked. The catalog fixed the *where*. What it didn't fix, and mostly doesn't claim to, is the *whether* — whether the thing sitting in that docs tab is still true.

## What co-location actually guarantees

Backstage's own documentation is honest about what TechDocs is designed to do: turn documentation into a first-class engineering artifact by combining Markdown, Git, MkDocs, CI/CD, and the software catalog into one pipeline. The mechanism is co-location — docs live in the same repository as the code they describe, ship through the same pull requests, and inherit the same code review. That's a genuine improvement over a wiki nobody owns.

But read that mechanism carefully and notice what it actually guarantees. Co-location guarantees a documentation *file* gets reviewed alongside a code change, if a human remembers to touch it. It does not guarantee the *content* of that file reflects the code once the PR merges. A developer can update a function signature, skip the paragraph in `docs/api.md` that describes it, get an approving review from a teammate who didn't check either, and merge. The docs tab still renders. It's still wrong. Nothing in the co-location model catches that, because co-location was never designed to check content against source — it was designed to make the update *convenient*, on the assumption that convenience produces compliance. It mostly doesn't.

## The number that makes this concrete

A widely cited 2026 figure on internal documentation puts the scale of the problem plainly: only 3% of engineers say they fully trust their documentation repositories. That statistic isn't measuring teams with no doc tooling — it's measuring teams that, in large part, already have TechDocs, Confluence, Notion, or some equivalent. The infrastructure for *storing* documentation reliably has never been the bottleneck. The infrastructure for *keeping it accurate* barely exists, and most of what does exist is detective rather than preventive — you find out docs are stale when someone hits a wrong parameter name in production, not before.

Backstage's own team appears to recognize this. Public roadmap discussion floats ideas like a "Trust Card" with an associated Trust Score, plus automatic notifications that trigger documentation maintenance — tooling aimed at surfacing staleness after the fact, not eliminating the conditions that produce it. That's a reasonable next step for a catalog platform to build. It's also, structurally, a scoring system layered on top of a problem the underlying workflow still allows to happen in the first place.

## Why hand-authored content can't fully close this gap

The root issue isn't tooling quality — Backstage, Port, and Cortex are all well-built products. It's that a docs tab backed by hand-written Markdown is only ever as accurate as the last person who remembered to edit it, and "remembered to edit it" is a habit, not a guarantee, no matter how tightly it's wired into the PR flow. Code review catches logic errors reliably because reviewers can *run* the code, or reason about it against a spec. Reviewers checking documentation are checking prose against their own memory of what the code does — a weaker signal, prone to exactly the kind of drift that compounds quietly over months.

The structural fix isn't a better reminder system. It's not generating the reminder in the first place, by generating the content itself from the thing that can't lie: the code's own AST.

## What that looks like mechanically

`jsdoc-scribe` reads a project's Abstract Syntax Tree via the TypeScript compiler API — used strictly as a parser, no AI or LLM anywhere in the pipeline, 100% local. `gen-comments` walks real function signatures — actual parameter names, actual types, actual return annotations — to produce deterministic JSDoc blocks. `gen-docs` walks the same structure to build a static documentation site, plus an automatic Architecture Insight page and, with the optional `code-multivitals` peer dependency, a `--quality` code-health dashboard. The `--check-drift` flag closes the loop that co-location alone can't: it re-parses the AST, diffs it against the existing documentation, and fails CI if they've diverged — the same enforcement model a linter uses for code style, applied to whether a doc comment still matches the function it describes.

That's the piece missing from the catalog-tab model as most teams currently run it. A docs tab populated from a `gen-docs` build step, gated by `--check-drift` in the same CI pipeline that already blocks a bad PR, doesn't rely on a reviewer noticing that a paragraph is now wrong. The build simply won't produce content that's out of sync with the AST it read, because there's no path for a human to silently skip the update — the update *is* the build. Whether that build output lands in a catalog's docs tab via a static-site link, a scheduled sync, or some other wiring is a platform team's integration decision to make, not a feature jsdoc-scribe ships out of the box today — but the architectural fit is direct: the catalog owns *where* and *how it's surfaced*, and a drift-checked generator owns *whether it's still accurate*, and those are genuinely separable concerns that most current setups conflate.

## What this doesn't solve

To be direct about the limits: this only closes the gap for content a tool can derive from source structure — function signatures, types, module relationships, architecture shape. It does nothing for the parts of documentation that are inherently narrative and can't be inferred from an AST: why a design decision was made, what trade-off a team accepted, what a runbook step is actually for during an incident. Those still need a human to write them well, and no AST-based tool changes that. The realistic split is a catalog docs tab with two tiers — generated reference content that can't drift because it's rebuilt from source every time, and hand-written narrative content that still needs the review discipline TechDocs-style co-location already provides. Treating the two as the same problem is part of why the 3% trust number is what it is.

## Bottom line

Platform teams have spent real effort solving where documentation lives and making sure it ships through the same review process as code. That was worth doing, and it isn't the same problem as making sure the documentation is still correct six months and forty PRs later. Co-location produces convenience. Convenience doesn't reliably produce accuracy. Generating the derivable half of your catalog's docs tab from source, gated by a drift check in CI, closes a gap that better reminders and trust scores can only ever paper over.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
