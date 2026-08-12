---
slug: docs-biggest-reader-isnt-human-anymore
title: 'Your Docs'' Biggest Reader Isn''t Human Anymore'
description: AI agents now account for roughly half to two-thirds of documentation traffic on major hosted-docs platforms, up from under 20% at the start of the year. Here's what that shift actually changes about how documentation should be generated and packaged, for engineering leaders deciding where to spend on tooling next.
date: 2026-08-12
readingTime: 8 min read
tags: [EngineeringManagement, CTO, DeveloperTools, AI, Documentation, DeveloperExperience]
image: ../assets/docs-biggest-reader-isnt-human-anymore.png
---

Pull up the traffic dashboard for almost any hosted documentation platform in 2026 and you'll find the same story: the majority reader of your docs is no longer a person. Mintlify's midyear traffic report puts AI-agent requests at **66% of measured web traffic** across its hosted docs sites in July — up from 15.2% in January, a 52-percentage-point swing in seven months. GitBook's independent measurement landed at 51.8% of intentional documentation reads coming from AI agents as of May. Claude Code and Cursor alone account for roughly 95% of that agent share. If the current trajectory holds, agent traffic could approach 90% of total docs traffic by year-end.

That's not a curiosity. It's a quiet infrastructure shift most engineering orgs haven't budgeted for, because nobody sent a memo. Documentation pipelines were built, almost without exception, around a human clicking through a rendered site — search bar, sidebar nav, syntax-highlighted code blocks, maybe a dark mode toggle. None of that is what an AI coding agent needs when it pulls your docs into a context window mid-task. And the gap between "docs a human can read" and "docs an agent can actually use" is where a growing share of your documentation spend is quietly going to waste.

## This is a different problem than stale docs

We wrote about documentation staleness and AI coding agents on this blog before — the "context rot" post from July 31 covered a specific failure mode where an agent confidently suggests a call to a function that was renamed two sprints ago, because the documentation it read didn't keep up with the codebase. That's an **accuracy** problem: the docs exist, they're wired into the agent's context, but they're wrong.

The traffic-composition data changes the question entirely. It's not "are the docs an agent reads correct" — it's "are the docs even packaged in a form an agent can efficiently consume in the first place." A beautifully rendered documentation site with clean, accurate, up-to-date content can still be a bad source for an AI agent if the only way to get at it is scraping rendered HTML full of navigation chrome, cookie banners, and JavaScript-gated content the agent has to fight through to extract the three sentences it actually needs. Accuracy and packaging are separate axes, and most teams have only ever optimized for one of them — usually the one a human reviewer will notice.

## What "agent-ready" documentation looks like in practice

Two patterns have emerged as the de facto standard in 2026, and it's worth knowing both even if you're not ready to adopt either immediately:

**llms.txt** is a plain-text, Markdown-formatted index file served at the root of a docs site — `/llms.txt` and often a fuller `/llms-full.txt` — that gives an agent a clean, structured map of the documentation without the HTML scaffolding. Cursor, Windsurf, Claude Code, GitHub Copilot, Cline, and Aider all check for it when pointed at a docs site. Mintlify now auto-generates one for every hosted site it serves.

**MCP documentation servers** go a step further: instead of a static file, they expose a live tool an agent can call to fetch current, version-specific documentation on demand. Context7, built by Upstash, is the clearest example — it serves version-pinned code documentation and examples to any MCP-compatible client specifically to stop agents from hallucinating APIs that changed since the model's training cutoff. Mintlify auto-hosts an equivalent MCP server per docs site now, meaning an agent working in a codebase can query the actual current docs instead of guessing from stale training data.

Neither pattern is exotic anymore. They're becoming table stakes the same way a sitemap.xml became table stakes for SEO fifteen years ago — invisible to the end user, quietly determining whether the right audience (increasingly, a non-human one) can actually find and use what you published.

## Why the generation method matters more here than it looks

Here's the part that's easy to miss if you think of this purely as "add a file to the docs repo": an llms.txt or an MCP server is only as good as its source. If it's a second, hand-maintained artifact — someone periodically exports a summary, pastes it into a text file, commits it — it starts drifting from the real documentation the moment it's written, for exactly the same reason hand-written JSDoc comments drift from the functions they describe. You'd be solving a packaging problem by reintroducing an accuracy problem, and doing it with a doc surface that's harder to review than the primary site because almost nobody reads a `llms.txt` file end to end in a PR review.

The pipelines that will handle this well are the ones where the human-facing site and the agent-facing feed come from the same regeneration step, not two independently maintained ones. That's a build-process property, not a feature checkbox — and it's the reason a documentation generator that regenerates from source on every run, rather than one that treats generated docs as a one-time scaffold you then hand-edit, has a structural advantage here it wasn't originally built for.

## Where jsdoc-scribe fits, honestly

To be precise about what exists today and what doesn't: jsdoc-scribe does not currently generate an `llms.txt` file or run an MCP server. That's not a shipped feature, and this isn't a feature announcement dressed up as a trend piece.

What it does have is the right raw material for either pattern, because of how it already works. `gen-docs` produces the documentation site fresh from the TypeScript AST on every run — using the TypeScript compiler API purely as a parser, no AI, no LLM calls, entirely local — which means the output is always a faithful, current reflection of the source, not a snapshot someone edited by hand last quarter. The programmatic API exposes that same generation step directly, so a build script can pull structured documentation data without going through the rendered HTML at all. And `--check-drift` already exists as a CI gate that fails a build when generated docs would differ from what's committed — the exact mechanism that would keep an llms.txt or MCP feed from drifting out of sync with the primary site, if someone wired one up on top of the existing programmatic output.

None of that is a claim that jsdoc-scribe solves the llms.txt/MCP problem today. It's an observation that teams evaluating documentation tooling with this traffic shift in mind should weight "does this regenerate from source with a single command, or does it produce something a human then maintains by hand" more heavily than they might have six months ago — because the honest answer to that question now determines whether your documentation infrastructure can extend to a second, machine-facing surface without doubling your maintenance burden.

## Bottom line

The reader composition of documentation has already shifted for a meaningful share of teams, whether or not their tooling budget has caught up. Mintlify and GitBook's numbers aren't a prediction — they're a July and May 2026 measurement. The practical takeaway for engineering leadership isn't "go build an llms.txt file this sprint." It's narrower and more useful: when you're next evaluating or building documentation tooling, ask whether it produces a single source of truth regenerated on demand, because that's the property that will let you extend to an agent-facing format later without starting a second, parallel documentation project from scratch.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/) &middot; npm: [jsdoc-scribe](https://www.npmjs.com/package/jsdoc-scribe) &middot; GitHub: [imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe)
