---
slug: changelog-bug-fixed-then-came-back
title: 'We Fixed a Changelog Bug on August 7. Two Releases Later, It''s Back.'
description: A self-audit three weeks ago found and fixed a jsdoc-scribe release that shipped with no changelog entry. Today the same gap reappeared on two newer releases — proof that a manual fix doesn't hold, and the honest case for Conventional Commits plus automated release tooling.
date: 2026-08-18
readingTime: 8 min read
tags: [DeveloperTools, ChangeLog, OpenSource, Maintenance, CI]
image: ../assets/changelog-bug-fixed-then-came-back.png
---

On August 7, we published a self-audit of jsdoc-scribe's own repository. One of the four findings was small and specific: version `2.5.1` had bumped `package.json` and merged to `main` with zero corresponding entry in `CHANGELOG.md`. We backfilled it, noted that this was already the second time this exact class of gap had happened — six earlier versions, `2.4.1` and `2.4.3` through `2.4.7`, had needed the same retroactive reconstruction back in July — and wrote this line: "a CI check that fails a release if `package.json`'s version changed but `CHANGELOG.md` didn't is the obvious next step, and it's now tracked as a real follow-up instead of something we'll rediscover the next time this happens."

We didn't build that check. Today's routine repo scan confirms exactly what that sentence predicted would happen if we didn't.

## What we found today

`package.json` is currently at `2.5.3`. `CHANGELOG.md`'s newest heading is still `[2.5.1] - 2026-07-31`.

```bash
grep '"version"' package.json
# "version": "2.5.3",

grep -n "^## \[2\.5" CHANGELOG.md
# 7:## [2.5.1] - 2026-07-31
# 16:## [2.5.0] - 2026-07-31
```

Two releases, `2.5.2` and `2.5.3`, have shipped since the August 7 backfill with no changelog entry at all — not a thin one, not a placeholder, nothing. Anyone reading `CHANGELOG.md` today has no way to know two versions happened, let alone what changed in them. This is now the third occurrence of the identical failure mode on this project: the July backfill (six versions), the August 7 backfill (one version), and this one (two versions, still open as of today).

That pattern is the actual finding here, more than any single missing entry. A version bump and a changelog update are two separate manual steps in this repo's release process, performed by a person, with nothing checking that both happened. We proved on August 7 that we knew this. We fixed the symptom for one release and moved on, and the underlying cause shipped the same bug again within three weeks.

## Why the manual fix didn't hold

This isn't a discipline problem you solve by trying harder next time. It's a structural one: as long as "bump the version" and "write the changelog entry" are two independent actions that a human has to remember to do together, they will eventually be done apart — not because anyone is careless, but because nothing in the pipeline treats them as one atomic operation. A backfill closes the specific instance. It doesn't touch the mechanism that produced it.

The fix that actually holds is one where the version and the entry can't come apart because they're generated from the same input in the same automated step. That's what [Conventional Commits](https://blog.marcnuri.com/conventional-commits) plus a release automation tool — [semantic-release](https://github.com/semantic-release/semantic-release) or [Release Please](https://devopsil.com/articles/2026-03-21-semantic-versioning-automated-releases) are the two most established options in 2026 — actually does differently from what this repo does today. Commits are written in a structured format (`fix:`, `feat:`, `feat!:` or `BREAKING CHANGE:` in the footer). A tool parses the commit log since the last release, computes the correct semantic version bump from that structure alone, and generates the changelog entry from the same commit messages, in the same run, as part of publishing the release. There's no second manual step to forget, because there's only one step. Teams that adopt this typically pair it with a `commitlint` check in CI so a PR with a non-conventional commit message fails before merge, rather than being caught after the fact.

None of that exists in jsdoc-scribe's release process right now. Commits aren't required to follow any structured format, the version bump in `package.json` is a manual edit, and nothing in CI checks that a version change carries a matching changelog entry. The August 7 post said this was "tracked as a real follow-up." In practice, tracked meant a sentence in a blog post, not a CI job — and a sentence doesn't fail a build.

## This isn't just an internal annoyance

It's tempting to file "our own changelog has a gap" under low-stakes and move on, but the pattern generalizes past this one file. A [2026 survey of 143 founders, operators, and engineers](https://slite.com/learn/dangers-of-stale-documentation) on documentation drift found that only 37% relied on a named owner as their fix, 24% used a scheduled review cadence, and a full 25% described themselves as "still reactive, no real system" — the exact shape of what happened here. The same survey's underlying point is worth sitting with even outside its own context (internal knowledge bases, not open-source changelogs): once something reads a stale record with confidence and acts on it — a person skimming release notes before upgrading, or increasingly an AI coding assistant summarizing "what's new" from a package's changelog — the record being wrong stops being a minor inconvenience and starts being a source of bad decisions made with full confidence.

For a changelog specifically, the practical cost is smaller but real: a maintainer or a downstream consumer checking "what changed between 2.5.1 and 2.5.3 before I upgrade" gets nothing, and has to diff commits by hand or just guess.

## What we're actually doing about it

Not another backfill dressed up as a fix. This time the follow-up is logged as a dated, specific to-do rather than a closing paragraph: adopt Conventional Commits for this repo's commit messages, add a `commitlint` CI check on PRs, and wire in `semantic-release` or Release Please so the version bump and the changelog entry are generated together, automatically, from the commit history — the same pattern described above. Until that ships, we're stating the gap plainly rather than quietly backfilling `2.5.2` and `2.5.3` and letting the underlying cause go unaddressed a third time.

If you maintain a package with the same two-manual-steps release process — and most small-to-mid npm packages do, because it's the default until something forces a change — this is worth checking in your own repo before it's the thing a user finds instead of you: does your latest `package.json` version have a matching entry at the top of your changelog, and if there's a gap, is anything besides memory stopping it from happening again?

## Bottom line

A manual fix to a missing-changelog-entry problem doesn't survive contact with the next release, because nothing enforces the invariant it depends on. We proved that twice now on the same repository. The actual fix isn't writing the entry after the fact — it's making the version bump and the changelog entry come from the same automated step, so skipping one without the other stops being possible. That's the work now queued, dated, and public, instead of the next paragraph in a future audit post.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

Full docs: [imchintoo.github.io/jsdoc-scribe](https://imchintoo.github.io/jsdoc-scribe/blog/index.html). Package on npm: [`jsdoc-scribe`](https://www.npmjs.com/package/jsdoc-scribe). Source: [github.com/imchintoo/jsdoc-scribe](https://github.com/imchintoo/jsdoc-scribe).
