---
slug: the-bus-factor-nobody-puts-on-a-slide
title: 'The Bus Factor Nobody Puts on a Slide: How to Measure It, and the One Lever That Actually Moves It'
description: Bus factor has real measurement methodology now — silo ratios, truck-factor algorithms, dedicated tooling — and a hard dollar cost for getting it wrong. Here is how to measure it for your team and the one lever that raises it without adding headcount.
date: 2026-07-30
readingTime: 7 min read
tags: [EngineeringManagement, CTO, TechDebt, Documentation, RiskManagement]
image: ../assets/the-bus-factor-nobody-puts-on-a-slide.png
---

Every engineering leader has said some version of "if Priya got hit by a bus tomorrow, we'd be in real trouble" — usually as a joke, in a hallway, about a specific person everyone in the room can picture. It's the most honest risk assessment most teams ever do, and it's also the last time most teams ever think about it in concrete terms. Nobody puts "bus factor: 1" on a board slide next to burn rate and ARR, even though it's arguably a bigger single point of failure than most of what does make that slide.

That's starting to change, and not because the joke got less true. It's changing because bus factor stopped being a vibe and became a number you can actually compute.

## What bus factor actually is

Bus factor (also called truck factor, same idea, less committal about the vehicle) is the minimum number of people who'd need to leave a project before it stalls from lost knowledge. A bus factor of 1 means one person holds context — architectural, historical, or just "why this function is written this way" — that nobody else has. If they leave, the project doesn't just lose a person, it loses the only working map of a piece of itself.

The informal version of this has been engineering-team folklore for decades. What's new in 2026 is that it's measurable with actual methodology instead of a gut feeling in a 1:1.

## How it's measured now

The most widely cited approach is a metric called **silo ratio**: the percentage of meaningful commits to a given file or module made by its single top contributor. A file where one engineer authored 95% of the commit history has a 95% silo ratio — a near-total information silo, whether or not anyone's called it that out loud. Run across a whole repository, silo ratio gives you a per-module heat map of exactly where the organization is exposed, instead of a single team-wide guess.

Layered on top of that is Avelino's Truck Factor algorithm, a greedy approach that identifies the top authors of a system by an authorship metric and then iteratively simulates removing them, checking at each step whether the project would "stall" — meaning enough files would lose all their knowledgeable contributors that the codebase becomes effectively orphaned. It's the same idea as silo ratio but applied recursively across the whole dependency graph of who-knows-what, rather than file by file.

There's now dedicated tooling built specifically to compute and visualize this instead of leaving it as a research-paper exercise: Bus Factor Explorer, published on arXiv, provides a treemap visualization and simulation mode so a team can see, concretely, which modules go dark under which departure scenarios — not just a single team-wide score, but a map of exactly where the org is thin.

The consensus number worth anchoring to: **a bus factor of 3 to 5 or higher per critical module** is the target most 2026 sources converge on. A bus factor of 1 is the danger zone — not hypothetically, but by the formal definition of the metric.

## What it actually costs when the number is 1

Here's where this stops being an academic exercise. The dollar cost of a low bus factor shows up the moment that single point of knowledge leaves — through attrition, a move to another team, or just a long leave — and someone else has to reconstruct what they knew.

2026 onboarding-cost data puts the true first-90-days cost of bringing a new engineer up to speed at **$20,000 to $80,000**, and salary during the ramp period accounts for only about 40% of that figure. The rest is mentor time pulled away from their own work, tooling and access provisioning, and — the part that compounds — a measurable drag on team velocity while the new hire is still learning the system. Layered on top: new hires reach only **25% productivity in their first 30 days** without structured onboarding, and on a large, under-documented codebase, reaching full productivity can take up to **six months**.

Now put that number next to a bus factor of 1. Every one of those onboarding costs stops being a one-time hiring expense and becomes a recurring bill for replacing knowledge that lived in exactly one head. A team with a healthy bus factor pays it once, when someone genuinely new joins. A team with a bus factor of 1 on its critical modules pays a version of it every time the wrong person is out for two weeks and an incident lands in the middle of it.

## The lever that actually moves the number, without adding headcount

Most attempts to fix bus factor start with people-process solutions: pair programming, rotating on-call, forced code review across teams, deliberate cross-training. These genuinely help, and none are wrong. But they share a limit: they all draw on the one resource that's already scarce — the time of the engineers whose knowledge is the bottleneck in the first place. Cross-training requires that person to spend hours transferring knowledge manually, which is exactly the kind of work that gets deprioritized the moment a deadline shows up, for the same reason documentation does.

The lever that doesn't compete for that same scarce time is documentation that gets generated from the code itself, continuously, rather than written and transferred by the person who currently holds the knowledge. This is the actual mechanism, stated plainly: a silo ratio of 95% on a file means one person's *commits* dominate that file — but if the file's structure, signatures, and architecture are also captured in documentation that anyone on the team can read without that person's involvement, the commit-authorship silo stops being a knowledge silo. The code was still written by one person. The ability to understand it wasn't.

This is the specific gap `jsdoc-scribe` is built to close. It reads a project's Abstract Syntax Tree via the TypeScript compiler API — used purely as a parser, never a model, so there's no AI involved and nothing leaves the build environment — and generates accurate JSDoc comments and a full documentation site from what the code structurally is: real parameters, types, and return signatures, plus an automatic **Architecture Insight** page that reads a project's folder structure, detected framework, and architecture-pattern signals (layered, monorepo, hexagonal, feature-based, and 19 more), each with the concrete evidence behind it. That page is the closest thing to a bus-factor insurance policy a doc generator can produce — the orientation a covering engineer needs on day one, generated automatically instead of living only in the head of whoever designed the system.

Critically, it doesn't decay the way hand-written documentation does. A `--check-drift` CI gate can fail a build the moment code and docs diverge, which means the insurance policy stays current for as long as the tool runs in CI — not just for the week after someone remembered to update it. That's the property that actually matters for bus factor specifically: the metric measures *current* knowledge concentration, and documentation that's stale by six months doesn't meaningfully lower it, no matter how thorough it looked on the day it was written.

## How to actually run this for your team

A practical version of this doesn't require the full academic tooling on day one. Pick your three or four most business-critical modules — the ones where an incident would hurt most — and check silo ratio with `git log --format='%an' -- <path> | sort | uniq -c | sort -rn` to see what fraction of commits trace back to one name. Anything north of 70-80% concentrated in a single author is worth flagging as a real risk. From there, refresh documentation for those modules first, wire a drift check into CI so it doesn't erode, and re-run the silo check in 90 days to see whether the number moved. That's a board-reportable before-and-after, not a vibe.

## Bottom line

Bus factor stopped being a hallway joke the moment it became something you could compute, track, and report a trend line on. The dollar cost of getting it wrong — $20K-$80K per onboarding event, paid over and over on the modules where one person's knowledge is the only map — is exactly the kind of number that belongs next to burn rate on a leadership slide, not because it's dramatic, but because it's real and it's actionable. The lever that moves it without competing for your senior engineers' scarce time is documentation that's generated from the code continuously, checked for drift automatically, and never depends on someone remembering to update it after the fact.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs at [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), package on npm as [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe), source at [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
