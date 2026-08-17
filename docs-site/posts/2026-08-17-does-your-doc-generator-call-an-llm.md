---
slug: does-your-doc-generator-call-an-llm
title: 'Before You Adopt an AI Documentation Tool, Ask These Five Questions'
description: 2026 research on AI coding assistants found repositories using them leak secrets at a materially higher rate than repositories that don't. A documentation generator built on the same mechanism — read your code, send it to a model — carries the same exposure. Here is a five-question checklist to run before you adopt one, with the data behind each question.
date: 2026-08-17
readingTime: 8 min read
tags: [Security, DeveloperTools, CTO, EngineeringManagement, Procurement, Documentation]
image: ../assets/does-your-doc-generator-call-an-llm.png
---

Most vendor evaluations for developer tooling still run through the same short list: does it do what we need, does it fit our stack, what does it cost. For a growing category of tools — AI-powered documentation generators that read your source and send it to a cloud model to produce docstrings, READMEs, or API references — that list is missing the question that matters most in 2026: what happens to the code while the tool is doing its job.

This isn't a hypothetical concern anymore. It's measured.

## The data point that should be in every vendor evaluation

GitGuardian's research, published via Kusari's March 2026 AppSec report, found that **6.4% of repositories using GitHub Copilot leak at least one secret — 40% higher than the 4.6% baseline rate in repositories without AI coding assistance**. Separately, Apiiro's September 2025 study found AI-generated code introduced over 10,000 new security findings per month across the repositories it tracked, a 10x spike in six months, with privilege-escalation paths up 322% and architectural design flaws up 153% in that window. The Cloud Security Alliance and Endor Labs, in a joint analysis, put a related number even higher: 62% of AI-generated code contains design flaws or known vulnerabilities.

None of that research is about documentation tools. It's about AI coding assistants — Copilot, Cursor, Claude Code, Tabnine — the tools that write or complete code. But the exposure mechanism the research measures isn't specific to code generation. It's inherent to any tool where source code flows into a third-party model: the model provider now has a copy of what you sent, retained under whatever policy applies to that account tier, transmitted over whatever network path the tool uses, logged in whatever way the vendor logs inference requests. A coding assistant and a documentation generator built the same way — read the file, call the API, get text back — share that exposure profile identically. The research just hasn't been run on the documentation category specifically yet, which makes the coding-assistant numbers the closest available empirical proxy, not a perfect substitute.

It matters that this category exists and isn't a fringe case. A quick survey of open-source documentation generators built in the last two years turns up several that route entire files or full codebases through cloud LLM backends — Claude, GPT-4, Gemini — as the default operating mode, with local-model support offered as an opt-in configuration rather than the default. If a team adopts one of these without reading past the README's feature list, "generates better docs than JSDoc used to" and "sends your code to a third-party API on every run" are both true at once, and only one of them is usually stated up front.

## Five questions worth asking before you adopt one

**1. Does it call an external API at all, and is that documented or discoverable only by reading the source?** Some tools state this plainly in their README. Others bury it in a config file's default value, or in a dependency three layers deep. If you can't answer this question from the product page in under a minute, that's itself the answer — treat it as "yes, and undocumented" until proven otherwise.

**2. If it does call an API, what's the retention and training-use policy of the specific account tier you'd actually be on?** Enterprise API tiers from major model providers typically carry different (often stricter) data-retention terms than free or personal tiers — but "the provider has a good enterprise policy" only protects you if your team is actually provisioned on that tier, with that contract, not on whatever the default sign-up flow lands a developer on.

**3. Can the tool run with zero network calls, even if that means slower adoption or a smaller feature set?** This is the question the coding-assistant leak data makes concrete: a 40% relative increase in secret exposure isn't a rounding error, and it's the direct, measured cost of the network-call architecture — not a hypothetical one. A tool that can't run offline can't structurally rule this risk out; it can only promise to manage it well.

**4. Does the vendor's own security page or SOC 2 scope mention what happens to submitted code specifically** — as opposed to generic language about "customer data" that doesn't distinguish source code from account metadata? Source code deserves its own line item in a security review, not a footnote under a broader data-handling paragraph.

**5. What's the actual dependency tree, and how much of it would need to be trusted rather than verified?** A tool with a single, well-known runtime dependency is something a security team can audit end to end in an afternoon. A tool with a deep tree touching multiple SDKs, telemetry libraries, and API clients is something a team has to trust rather than fully verify — which is a reasonable trade for some tools, but should be a conscious one, not a default nobody looked at.

None of these five questions require rejecting AI-assisted tooling outright. Plenty of teams have legitimate reasons to want narrative, context-aware documentation an AST-only tool structurally can't produce, and have done the diligence to accept the trade. The point of the checklist is that "does it read my code and where does that reading go" belongs in the evaluation at all, on the same list as pricing and feature fit — not as an afterthought discovered during a later security review, after the tool is already wired into CI.

## Where jsdoc-scribe sits against this checklist

Worth being concrete about our own answer, since the fair version of this piece states it plainly rather than leaving it implied. `jsdoc-scribe`'s two CLIs — `gen-comments` for JSDoc comment generation and `gen-docs` for building a full documentation site — along with its programmatic API and ESLint plugin, all run on the same architecture: the TypeScript compiler API used purely as a parser to walk your code's Abstract Syntax Tree, generating output from what's structurally present in real parameter names, types, and return signatures. There is no model in that pipeline, no API key to configure, no network call to make — not disabled by a setting, but absent from the code path entirely. The `--quality` code-health dashboard (via the optional `code-multivitals` peer dependency) and the automatic Architecture Insight page both work the same way: static analysis of what's actually in the repository, not inference from a model. `--check-drift` gates a CI build the moment generated docs and source code diverge, which is the enforcement mechanism, not a courtesy warning.

Against the five questions above: no external API, so questions 1 and 2 don't apply. Zero network calls by construction answers question 3 directly rather than as a policy promise. There's no code-handling clause to hunt for in a security page for question 4, because there's no code transmission to describe. And the dependency tree is a single runtime package — `typescript` — small enough that question 5's audit is an afternoon, not a project. It's MIT licensed and free, so none of this is gated behind a paid tier that changes the retention terms depending on what a team happens to be provisioned on.

That's not a claim that this architecture is strictly better for every documentation need — the trade-off against narrative-generating AI tools has been covered honestly on this blog before, and it's real. It's a claim that the specific risk the 2026 secret-leak data measures is one this design rules out structurally, which is a different and stronger property than a policy that manages it well.

## Bottom line

The AI coding assistant secret-leak numbers are new and specific enough that they belong in developer-tooling evaluations broadly, not just for the tools that write code. A documentation generator that reads your whole codebase and sends it to a cloud model shares the same exposure mechanism the 2026 research measured — the research just hasn't been run on this category by name yet. Ask the five questions before adoption, not after the tool is already in CI. It costs nothing to ask, and the answer changes what you're actually agreeing to.

```bash
npx jsdoc-scribe . --write            # try it once, no install
npm install --save-dev jsdoc-scribe   # add it to the project
```

More at the [docs site](https://imchintoo.github.io/jsdoc-scribe/blog/index.html), on [npm](https://www.npmjs.com/package/jsdoc-scribe), and on [GitHub](https://github.com/imchintoo/jsdoc-scribe).
